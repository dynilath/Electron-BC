import fs from "fs";
import { getScriptFolder } from "./Constants";
import { readMeta } from "./meta";
import { ScriptConfig } from "./config";
import path from "path";

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
  return (await scriptFiles())
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
}

const newScriptListeners: ((script: ScriptResourceItem) => void)[] = [];

function on(
  event: "new-script",
  listener: (script: ScriptResourceItem) => void
): void {
  newScriptListeners.push(listener);
}

function removeListener(
  event: "new-script",
  listener: (script: ScriptResourceItem) => void
): void {
  const index = newScriptListeners.indexOf(listener);
  if (index >= 0) newScriptListeners.splice(index, 1);
}

async function loadScriptFromUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  const content = await response.text();
  const meta = readMeta(content);
  if (!meta) throw new Error(`Failed to read metadata from ${url}`);
  const { setting } = ScriptConfig.getConfig(meta.name, url);
  const file = await saveScriptFile(content, meta);
  return { setting, meta, content, file } as ScriptResourceItem;
}

async function updateScripts() {
  return Promise.all(
    (await load()).map(async (script) => {
      const url = script.setting.url;
      if (!url) return;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      const content = await response.text();
      const meta = readMeta(content);
      if (!meta) throw new Error(`Failed to read metadata from ${url}`);
      saveScriptFile(content, meta);
    })
  );
}

export class ScriptResource {
  static load = load;
  static on = on;
  static removeListener = removeListener;
  static loadScriptFromUrl = loadScriptFromUrl;
  static updateScripts = updateScripts;
}
