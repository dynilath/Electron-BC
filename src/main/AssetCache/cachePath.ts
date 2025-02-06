import { app } from "electron";
import path from "path";
import settings from "electron-settings";
import fs from "fs";

const SettingTag = "CachePath";

const defaultCachePath = path.join(
  app.getPath("appData"),
  "Bondage Club",
  "AssetCache"
);

let cachePath: string | null = null;

export function getCachePath() {
  if (cachePath) return cachePath;

  const setting = settings.getSync(SettingTag);
  if (typeof setting === "string") {
    cachePath = setting;
  } else {
    cachePath = defaultCachePath;
    settings.set(SettingTag, cachePath);
  }
  return cachePath;
}

function isDirectoryEmpty(path: string) {
  return fs.readdirSync(path).length === 0;
}

export async function relocateCachePath(
  newPath: string,
  copyConfirm: () => boolean | PromiseLike<boolean>
) {
  const oldPath = getCachePath();
  if (oldPath === newPath) return;

  if (!fs.existsSync(newPath) || !fs.statSync(newPath).isDirectory()) return;

  let needClearSizeResult = true;

  // If the new path is empty, we may move old cache to new path
  if (isDirectoryEmpty(newPath)) {
    const confirm = await copyConfirm();

    if (confirm) {
      const onSameDevice = (() => {
        if (process.platform === "win32")
          return path.parse(oldPath).root === path.parse(newPath).root;
        else return path.parse(oldPath).dir === path.parse(newPath).dir;
      })();

      if (onSameDevice) {
        fs.rmSync(newPath, { recursive: true });
        fs.renameSync(oldPath, newPath);
      } else {
        const contents = fs.readdirSync(oldPath);
        for (const item of contents) {
          fs.copyFileSync(path.join(oldPath, item), path.join(newPath, item));
        }
        fs.rmSync(newPath, { recursive: true });
      }
      needClearSizeResult = true;
    }
  }

  if (needClearSizeResult) clearSizeResult();

  console.log(`Relocate cache from ${oldPath} to ${newPath}`);
  cachePath = newPath;
  settings.set(SettingTag, newPath);
}

let cachedSizeResult: undefined | string = undefined;

export function fileSizeStr() {
  if (cachedSizeResult) return cachedSizeResult;

  const cachePath = getCachePath();

  const size = fs
    .readdirSync(cachePath, { withFileTypes: true })
    .reduce((size, file) => {
      if (file.isFile()) {
        size += fs.statSync(path.join(cachePath, file.name)).size;
      }
      return size;
    }, 0);

  cachedSizeResult = formatSize(size);

  return cachedSizeResult;
}

export function clearSizeResult() {
  cachedSizeResult = undefined;
}

function formatSize(bytes: number) {
  const units = ["bytes", "KiB", "MiB", "GiB", "TiB"];
  let index = 0;

  while (bytes >= 1024 && index < units.length - 1) {
    bytes /= 1024;
    index++;
  }

  return `${bytes.toFixed(2)} ${units[index]}`;
}
