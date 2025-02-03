import { ipcMain } from "electron";
import { ScriptResource } from "./resource";

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
  scripts: Promise<ScriptResourceItem[]> | ScriptResourceItem[];

  handlers: Map<MyEvent, (...args: any[]) => any> = new Map();
  newScriptHandler: AnyFunction;

  menuItems: MenuItems[] = [];

  async finishLoad() {
    if (!Array.isArray(this.scripts)) this.scripts = await this.scripts;
    return this.scripts;
  }

  constructor(readonly webContents: Electron.WebContents) {
    this.scripts = ScriptResource.load();
    this.finishLoad();

    const old = stash.get(webContents.id);
    if (old) old.unload();
    stash.set(webContents.id, this);

    this.newScriptHandler = (script: ScriptResourceItem) => {
      loadOneScriptRaw(this.webContents, script);
    };

    ScriptResource.on("new-script", this.newScriptHandler);

    const GM_registerMenuCommand = (
      event: Electron.IpcMainEvent,
      id: number,
      scriptName: string,
      menuName: string
    ) => {
      if (this.webContents.id === event.sender.id) {
        this.menuItems.push({ id, scriptName, menuName });
      }
    };

    const GM_unregisterMenuCommand = (
      event: Electron.IpcMainEvent,
      mid: number
    ) => {
      if (this.webContents.id === event.sender.id) {
        const index = this.menuItems.findIndex((i) => i.id === mid);
        if (index >= 0) this.menuItems.splice(index, 1);
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
    ScriptResource.removeListener("new-script", this.newScriptHandler);
  }

  invokeMenu(id: number) {
    this.webContents.send("invoke-menu-command", id);
  }

  async loadOneScript(script: ScriptResourceItem) {
    loadScripts(this.webContents, [script]);
  }

  async loadScript() {
    const scripts = (await this.finishLoad()).filter((i) => i.setting.enabled);
    console.log("Script[Load] : " + JSON.stringify(scripts.map((i) => i.meta)));
    const waitLoad = loadScripts(this.webContents, scripts);
    await waitLoad;
  }
}
