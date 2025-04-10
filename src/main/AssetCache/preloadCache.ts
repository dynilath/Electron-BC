import fs from "fs";
import LZString from "lz-string";
import { aquire, fetchAsset, storeAsset } from "./database";
import { packageFile } from "../utility";
import settings from "electron-settings";

let preloadCacheRunning = false;

export function canPreloadCache() {
  return !preloadCacheRunning;
}

type DirLeaf = string | number;

interface Dir {
  [key: string]: DirLeaf | Dir;
}

const preloadDataPath = packageFile("resource/preload.data");

export async function preloadCache(url_prefix: string, verion: string) {
  if (preloadCacheRunning) return;
  preloadCacheRunning = true;

  const slash_url = url_prefix.endsWith("/") ? url_prefix : `${url_prefix}/`;

  const preloadData = await fs.promises.readFile(preloadDataPath, {
    encoding: null,
  });

  const content = JSON.parse(
    LZString.decompressFromUint8Array(preloadData)
  ) as Dir;

  console.log(`Preloading cache from ${url_prefix}`);

  const processList = Object.entries(content).map(([key, value]) => {
    return { container: value, path: `${key}/` };
  });

  // cache 'Assets' last
  processList.reverse();

  while (processList.length > 0) {
    let current = processList.pop() as { container: Dir; path: string };

    for (let [key, value] of Object.entries(current.container)) {
      const assetPath = `${current.path}${key}`;
      if (typeof value !== "object") {
        const url = `${slash_url}${assetPath}`;
        const db = await aquire();
        const data = await db.get(assetPath);
        if (!data || data?.version !== verion) {
          console.log(`Preloading ${url}`);
          const { buffer, type } = await fetchAsset(url);
          storeAsset(assetPath, verion, buffer, type);
        }
      } else {
        processList.push({ container: value, path: `${assetPath}/` });
      }
    }
  }
  console.log("Preloading cache done");
  preloadCacheRunning = false;
}

export const SettingTag = "PreloadCacheConfig";

export interface PreloadCacheConfig {
  version: string | null;
}

async function cacheVersion() {
  const config = (await settings.get(SettingTag)) as PreloadCacheConfig | null;
  return config?.version;
}

function saveCacheVersion(version: string) {
  settings.setSync(SettingTag, { version });
  console.log(`Cache version saved: ${version}`);
}

export async function checkCacheVersion(bcVer: BCVersion) {
  const currentVersion = await cacheVersion();
  const ret = !currentVersion || currentVersion !== bcVer.version;
  console.log(`Cache version check: ${currentVersion} -> ${bcVer.version}`);
  saveCacheVersion(bcVer.version);
  return ret;
}