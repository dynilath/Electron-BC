import settings from "electron-settings";
import { MyPrompt } from "./MyPrompt";
import { AssetCache } from "./AssetCache";

const SettingTag = "PreloadCacheConfig";

interface PreloadCacheConfig {
  version: string | null;
}

async function version() {
  const config = (await settings.get(SettingTag)) as PreloadCacheConfig | null;
  return config?.version;
}

async function saveVersion(version: string) {
  await settings.set(SettingTag, { version });
}

async function checkCache(url_prefix: string, cur_version: string) {
  const currentVersion = await version();

  if (!currentVersion || currentVersion !== cur_version) {
    MyPrompt.confirmCancel("Alert::Cache::UpdateConfirm", () => {
      AssetCache.preloadCache(url_prefix, cur_version);
    });
  }

  saveVersion(cur_version);
}

export class PreloadCacheSetting {
  static check = checkCache;
}
