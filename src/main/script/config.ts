import settings from "electron-settings";
import { SettingTag } from "./Constants";

const config_storage = new Map<string, ScriptConfigItem>(
  ((settings.getSync(SettingTag) as ScriptConfigItem[] | null) || []).map(
    (c) => [c.name, c] as [string, ScriptConfigItem]
  )
);

async function saveConfig() {
  return settings.set(
    SettingTag,
    Array.from(config_storage.values(), (v) => {
      return {
        name: v.name,
        setting: {
          enabled: v.setting.enabled,
          url: v.setting.url,
          lastUpdate: v.setting.lastUpdate,
        },
      };
    })
  );
}

export class ScriptConfig {
  static shrinkConfig(names: string[]) {
    const unused = [] as string[];
    config_storage.forEach((v, k) => {
      if (!names.includes(k)) unused.push(k);
    });
    unused.forEach((k) => config_storage.delete(k));
    saveConfig();
  }

  static async saveConfig(config: ScriptConfigItem) {
    config_storage.set(config.name, config);
    await saveConfig();
  }

  static getConfig(name: string, url: string | null = null): ScriptConfigItem {
    let ret = config_storage.get(name);
    if (ret) return ret;
    ret = {
      name,
      setting: {
        enabled: true,
        url,
        lastUpdate: Date.now(),
      },
    };
    config_storage.set(name, ret);
    saveConfig();
    return ret;
  }
}
