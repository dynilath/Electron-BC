import * as fs from "fs";
import { SettingTag, getDataFolder } from "./Constants";
import { ScriptItem } from "./ScriptItem";
import { net } from "electron";
import settings from "electron-settings";
import { handler } from "../handler";
import { isV1Config, isV2Config } from "./types";

export class ScriptManager {
  static scripts: Map<string, ScriptItem>;

  private static loadSettings(): V2ConfigItem[] {
    const config = settings.getSync(SettingTag) as ConfigItem[] | null;
    if (!config) return [];

    const upgradeConfig = config
      .map((c) => {
        if (isV1Config(c)) {
          return {
            name: c.name,
            setting: {
              enabled: c.enabled,
              url: null,
              lastUpdate: Date.now(),
            },
          } as V2ConfigItem;
        }
        if (isV2Config(c)) return c;
      })
      .filter((c) => c !== undefined) as V2ConfigItem[];

    return upgradeConfig;
  }

  private static async saveSettings() {
    const configs = Array.from(
      ScriptManager.scripts.entries(),
      ([name, item]): any => {
        return {
          name: name,
          setting: {
            enabled: item.data.setting.enabled,
            url: item.data.setting.url,
            lastUpdate: item.data.setting.lastUpdate,
          },
        } as V2ConfigItem;
      }
    );

    return settings.set(SettingTag, configs);
  }

  static onScriptLoaded(scriptName: string) {
    const script = this.scripts.get(scriptName);
    if (script) script.data.loaded = true;
    console.log("Script[Load Done] : " + JSON.stringify({ name: scriptName }));
  }

  public static async loadDataFolder() {
    const rawConfigs = new Map<string, V2ConfigItem>(
      this.loadSettings().map((_) => [_.name, _])
    );

    const newItemList = fs
      .readdirSync(getDataFolder(), { withFileTypes: true })
      .filter((i) => i.isFile() && i.name.endsWith(".user.js"))
      .map((i) => ScriptItem.loadFile(i.name))
      .filter((i) => i !== undefined)
      .map((i) => ({ meta: ScriptItem.loadMeta(i), content: i }))
      .filter((i) => i.meta !== undefined)
      .reduce((acc, cur) => {
        if (!acc.find((i) => i.meta.name === cur.meta?.name))
          acc.push({ meta: cur.meta as ScriptMeta, content: cur.content });
        return acc;
      }, [] as { meta: ScriptMeta; content: string }[])
      .map((i) =>
        ScriptItem.makeScriptItem(i.meta.name, rawConfigs, i.content, i.meta)
      );

    this.scripts = new Map(newItemList.map((_) => [_.data.meta.name, _]));

    await this.saveSettings();

    return this.scripts;
  }

  public static loadSingleScript(script: ScriptItem) {
    handler().then((h) => {
      h.send("load-script", script);
      console.log(
        "Script[Load] : " + JSON.stringify({ name: script.data.meta.name })
      );
    });
  }

  public static async loadScript(reload?: boolean) {
    Array.from(ScriptManager.scripts.values())
      .filter((i) => i.data.setting.enabled && (reload || !i.data.loaded))
      .forEach((i) => {
        i.data.loaded = false;
        this.loadSingleScript(i);
      });
  }

  public static switchItem(name: string) {
    const target = this.scripts.get(name);
    if (target) {
      const old = target.data.setting.enabled;
      target.data.setting.enabled = !old;
      this.saveSettings().then(() => {
        console.log(
          "Script[Switch] : " +
            JSON.stringify({
              name: target.data.meta.name,
              enabled: target.data.setting.enabled,
            })
        );
        if (!old && !target.data.loaded) this.loadSingleScript(target);
      });
    }
  }

  public static updateAll() {
    return new Promise<void>((accepted) => {
      const counter = new Set<string>(this.scripts.keys());
      const singleFinish = (name: string) => {
        counter.delete(name);
        if (counter.size === 0) {
          this.saveSettings().then(accepted);
        }
      };
      Array.from(this.scripts.values()).forEach((i) => {
        if (i.data.setting.url)
          this.loadOneFromURL(i.data.setting.url, i.data.filePath).then(
            () => singleFinish(i.data.meta.name),
            (e) => {
              console.error(e);
              singleFinish(i.data.meta.name);
            }
          );
        else singleFinish(i.data.meta.name);
      });
    });
  }

  public static loadOneFromURL(url: string, promptPath?: string) {
    return new Promise<void>((accepted, rejected) => {
      console.log("Script[Load URL] : " + url + " To : " + promptPath);
      const req = net.request(url);
      req.on("response", (r) => {
        r.on("data", (d) => {
          const content = d.toString("utf-8");
          const script = ScriptItem.saveScriptFile(url, content, promptPath);
          if (script) {
            this.scripts.set(script.data.meta.name, script);
            this.saveSettings();
            accepted();
          }
        });
      });
      req.on("error", (e) => {
        rejected(e);
      });
      req.end();
    });
  }
}
