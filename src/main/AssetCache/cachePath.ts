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

export async function relocateCachePath(newPath: string) {
  const oldPath = getCachePath();
  if (oldPath === newPath) return;

  cachePath = newPath;
  settings.set(SettingTag, newPath);

  await new Promise<void>((resolve, reject) => {
    fs.copyFile(oldPath, newPath, (err) => {
      if (err) reject(err);
      resolve();
    });
  });

  await new Promise<void>((resolve, reject) => {
    fs.rmdir(oldPath, { recursive: true }, (err) => {
      if (err) reject(err);
      resolve();
    });
  });
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
