import fs from "fs";
import { getScriptFolder } from "./Constants";
import { readMeta } from "./meta";
import { ScriptConfig } from "./config";
import path from "path";
import { ipcMain } from "electron";
import { reloadAllMenu } from "../reloadAllMenu";
import EventEmitter from "events";

function scriptFiles() {
  return new Promise<string[]>((resolve, reject) => {
    fs.readdir(getScriptFolder(), { withFileTypes: true }, (err, files) => {
      if (err) reject(err);
      else {
        const scriptFiles = files
          .filter((file) => file.isFile() && file.name.endsWith(".user.js"))
          .map((file) => path.join(file.parentPath, file.name));
        resolve(scriptFiles);
      }
    });
  });
}

function saveScriptFile(content: string, meta: ScriptMeta) {
  return new Promise<string>((resolve, reject) => {
    const desiredPath = path.join(
      getScriptFolder(),
      `${meta.name.replace(/[\\\/:*?"<>|]/g, "_")}.user.js`
    );
    fs.writeFile(desiredPath, content, { encoding: "utf-8" }, (err) => {
      if (err) reject(err);
      else resolve(desiredPath);
    });
  });
}

async function load() {
  const ret = (await scriptFiles())
    .map((file) => {
      const content = fs.readFileSync(file, { encoding: "utf-8" });
      const meta = readMeta(content);
      if (!meta) return undefined;
      return { meta, content, file };
    })
    .filter((i) => i !== undefined)
    .map(({ meta, content, file }): ScriptResourceItem => {
      const { setting } = ScriptConfig.getConfig(meta.name);
      return { setting, meta, content, file };
    });

  ScriptConfig.shrinkConfig(ret.map((i) => i.meta.name));
  return ret;
}

type ScriptEvent = {
  "new-script": [ScriptResourceItem];
};

const scriptEventEmmiter = new EventEmitter<ScriptEvent>();

async function fetchScript(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  const content = await response.text();
  const meta = readMeta(content);
  if (!meta) throw new Error(`Failed to read metadata from ${url}`);
  return { meta, content };
}

async function loadScriptFromUrl(url: string) {
  const { meta, content } = await fetchScript(url);
  const { setting } = ScriptConfig.getConfig(meta.name, url);
  const file = await saveScriptFile(content, meta);

  const ret = { setting, meta, content, file } as ScriptResourceItem;
  scriptEventEmmiter.emit("new-script", ret);
  return ret;
}

async function updateScripts() {
  return Promise.all(
    (await load()).map(async (script) => {
      const url = script.setting.url;
      if (!url) return;
      const { meta, content } = await fetchScript(url);
      saveScriptFile(content, meta);
    })
  );
}

function init() {
  ipcMain.on("load-script-url", async (event, url: string) => {
    await ScriptResource.loadScriptFromUrl(url);
    console.log("load-script-url - reload-menu");
    reloadAllMenu();
  });
}

export class ScriptResource {
  static load = load;
  static event = scriptEventEmmiter;
  static loadScriptFromUrl = loadScriptFromUrl;
  static updateScripts = updateScripts;
  static init = init;
}
