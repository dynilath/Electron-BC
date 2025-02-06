import { ipcMain } from "electron";
import { ScriptResource } from "./resource";
import { ScriptConfig } from "./config";

function loadOneScriptRaw(
  webContents: Electron.WebContents,
  script: ScriptResourceItem
) {
  webContents.send("load-script-v2", script);
  console.log("Script[Load] : " + JSON.stringify({ name: script.meta.name }));
}

function loadScripts(
  webContents: Electron.WebContents,
  scripts: ScriptResourceItem[]
) {
  const loadFlag = new Set(scripts.map((i) => i.meta.name));

  return new Promise<void>((accepted) => {
    const loadDone = (event: Electron.IpcMainEvent, name: string) => {
      if (event.sender.id === webContents.id) {
        loadFlag.delete(name);
        if (loadFlag.size === 0) {
          accepted();
          ipcMain.removeListener("load-script-done-v2", loadDone);
        }
      }
    };
    ipcMain.on("load-script-done-v2", (event, name: string) =>
      loadDone(event, name)
    );
    scripts.forEach((i) => loadOneScriptRaw(webContents, i));
  });
}

type AnyFunction = (...args: any[]) => any;

function registerHandler(
  event: MyEvent,
  func: AnyFunction,
  handlers: Map<MyEvent, AnyFunction>
) {
  handlers.set(event, func);
  ipcMain.on(event, func);
}

interface MenuItems {
  id: number;
  scriptName: string;
  menuName: string;
}

const stash = new Map<number, ScriptState>();

export class ScriptState {
  scripts: ScriptResourceItem[] = [];

  handlers: Map<MyEvent, (...args: any[]) => any> = new Map();
  newScriptHandler: AnyFunction;

  menuItems: MenuItems[] = [];

  async loadScriptResource() {
    this.scripts = await ScriptResource.load();
    this.needRefresh = false;
    return this.scripts;
  }

  needRefresh = true;

  loaded = false;

  constructor(readonly webContents: Electron.WebContents) {
    this.loadScriptResource();

    const old = stash.get(webContents.id);
    if (old) old.unload();
    stash.set(webContents.id, this);

    this.newScriptHandler = (script: ScriptResourceItem) => {
      this.scripts.push(script);
      loadOneScriptRaw(this.webContents, script);
    };

    ScriptResource.event.on("new-script", this.newScriptHandler);

    const GM_registerMenuCommand = (
      event: Electron.IpcMainEvent,
      id: number,
      scriptName: string,
      menuName: string
    ) => {
      if (this.webContents.id === event.sender.id) {
        this.menuItems.push({ id, scriptName, menuName });
        if (this.loaded) ipcMain.emit("reload-menu", webContents.id);
      }
    };

    const GM_unregisterMenuCommand = (
      event: Electron.IpcMainEvent,
      mid: number
    ) => {
      if (this.webContents.id === event.sender.id) {
        const index = this.menuItems.findIndex((i) => i.id === mid);
        if (index >= 0) this.menuItems.splice(index, 1);
        if (this.loaded) ipcMain.emit("reload-menu", webContents.id);
      }
    };

    registerHandler(
      "register-menu-command",
      GM_registerMenuCommand,
      this.handlers
    );

    registerHandler(
      "remove-menu-command",
      GM_unregisterMenuCommand,
      this.handlers
    );
  }

  unload() {
    this.handlers.forEach((func, event) => ipcMain.removeListener(event, func));
    ScriptResource.event.removeListener("new-script", this.newScriptHandler);
  }

  invokeMenu(id: number) {
    this.webContents.send("invoke-menu-command", id);
  }

  async loadOneScript(script: ScriptResourceItem) {
    loadScripts(this.webContents, [script]);
  }

  async toggleConfig(scriptName: string) {
    const script = this.scripts.find((i) => i.meta.name === scriptName);
    if (!script) return;

    script.setting.enabled = !script.setting.enabled;
    ScriptConfig.saveConfig({
      name: script.meta.name,
      setting: script.setting,
    });
    if (script.setting.enabled) await this.loadOneScript(script);
    else {
      this.menuItems = this.menuItems.filter(
        (i) => i.scriptName !== scriptName
      );
      this.needRefresh = true;
    }
  }

  async loadScript() {
    this.menuItems = [];
    const scripts = (await this.loadScriptResource()).filter(
      (i) => i.setting.enabled
    );
    const waitLoad = loadScripts(this.webContents, scripts);
    this.loaded = true;
    await waitLoad;
  }
}
