import fs from "fs";
import { getScriptFolder } from "./Constants";
import { readMeta } from "./meta";
import { ScriptConfig } from "./config";
import path from "path";
import { ipcMain } from "electron";
import { reloadAllMenu } from "../reloadAllMenu";
import EventEmitter from "events";

async function scriptFiles() {
  const files = await fs.promises.readdir(getScriptFolder(), {
    withFileTypes: true,
  });
  return files
    .filter((file) => file.isFile() && file.name.endsWith(".user.js"))
    .map((file) => path.join(file.parentPath, file.name));
}

async function saveScriptFile(content: string, meta: ScriptMeta) {
  const desiredPath = path.join(
    getScriptFolder(),
    `${meta.name.replace(/[\\\/:*?"<>|]/g, "_")}.user.js`
  );

  await fs.promises.writeFile(desiredPath, content, { encoding: "utf-8" });
  return desiredPath;
}

async function load() {
  const files = await scriptFiles();

  const ret = [] as ScriptResourceItem[];

  await Promise.all(
    files.map(async (file) => {
      const content = await fs.promises.readFile(file, { encoding: "utf-8" });
      const meta = readMeta(content);
      if (!meta) return;
      const { setting } = ScriptConfig.getConfig(meta.name);
      ret.push({ setting, meta, content, file });
    })
  );

  ScriptConfig.shrinkConfig(ret.map((i) => i.meta.name));

  ret.sort((a, b) => a.meta.name.localeCompare(b.meta.name, ["en", "zh-CN"]));
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
  return { setting, meta, content, file } as ScriptResourceItem;
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
    const ret = await ScriptResource.loadScriptFromUrl(url);
    scriptEventEmmiter.emit("new-script", ret);
  });
}

export class ScriptResource {
  static load = load;
  static event = scriptEventEmmiter;
  static loadScriptFromUrl = loadScriptFromUrl;
  static updateScripts = updateScripts;
  static init = init;
}
