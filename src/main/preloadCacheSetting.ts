import settings from "electron-settings";
import { MyPrompt } from "./MyPrompt";
import { AssetCache } from "./AssetCache";
import { ipcMain } from "electron";

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

async function checkCache(
  webContents: Electron.WebContents,
  BCVersion: { url: string; version: string }
) {
  const currentVersion = await version();

  if (!currentVersion || currentVersion !== BCVersion.version) {
    MyPrompt.confirmCancel(webContents, "Alert::Cache::UpdateConfirm", () => {
      AssetCache.preloadCache(BCVersion.url, BCVersion.version).then(() => {
        ipcMain.emit("reload-menu");
      });
      ipcMain.emit("reload-menu");
    });
  }

  saveVersion(BCVersion.version);
}

export class PreloadCacheSetting {
  static check = checkCache;
}
