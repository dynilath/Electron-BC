import { app } from "electron";
import path from "path";
import { ClassicLevel } from "classic-level";
import { net } from "electron";
import fs from "fs";
import LZString from "lz-string";
import { packageFile } from "./utility";

export interface CachedResponse {
  buffer: Buffer;
  type: string | null;
}

export interface CacheItem {
  base64Data: string;
  version: string;
  type: string | null;
  cacheTime: number;
}

const CachePath = path.join(
  app.getPath("appData"),
  "Bondage Club",
  "AssetCache"
);

const db = new ClassicLevel<string, CacheItem>(CachePath, {
  valueEncoding: "json",
});

function storeAsset(
  key: string,
  version: string,
  data: Buffer,
  type: string | null
) {
  db.put(key, {
    base64Data: data.toString("base64"),
    version,
    type,
    cacheTime: Date.now(),
  }).catch((error) => {
    console.error(`Failed to store asset ${key}: ${error}`);
  });
}

async function fetchAsset(url: string): Promise<CachedResponse> {
  const response = await net.fetch(url, { bypassCustomProtocolHandlers: true });
  const buffer = Buffer.from(await response.arrayBuffer());
  return { buffer, type: response.headers.get("Content-Type") };
}

async function requestAsset(
  url: string,
  key: string,
  version: string
): Promise<CachedResponse> {
  const data = await db.get(key);
  if (data && data.version === version) {
    return {
      buffer: Buffer.from(data.base64Data, "base64"),
      type: data.type,
    };
  } else {
    const { buffer, type } = await fetchAsset(url);
    storeAsset(key, version, buffer, type);
    return { buffer, type };
  }
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

let cachedResult: undefined | string = undefined;

function fileSizeStr() {
  if (cachedResult) return cachedResult;

  const size = fs
    .readdirSync(CachePath, { withFileTypes: true })
    .reduce((size, file) => {
      if (file.isFile()) {
        size += fs.statSync(path.join(CachePath, file.name)).size;
      }
      return size;
    }, 0);

  cachedResult = formatSize(size);

  return cachedResult;
}

function clearSizeResult() {
  cachedResult = undefined;
}

type DirLeaf = string | number;
interface Dir {
  [key: string]: DirLeaf | Dir;
}

let preloadCacheRunning = false;

function canPreloadCache() {
  return !preloadCacheRunning;
}

const preloadDataPath = packageFile("resource/preload.data");

async function preloadCache(url_prefix: string, verion: string) {
  if (preloadCacheRunning) return;
  preloadCacheRunning = true;

  const slash_url = url_prefix.endsWith("/") ? url_prefix : `${url_prefix}/`;

  const content = JSON.parse(
    LZString.decompressFromUint8Array(
      fs.readFileSync(preloadDataPath, { encoding: null })
    )
  ) as Dir;

  console.log(`Preloading cache from ${url_prefix}`);
  let processList = [{ container: content, path: "" }];
  while (processList.length > 0) {
    let current = processList.pop() as { container: Dir; path: string };

    for (let [key, value] of Object.entries(current.container)) {
      const assetPath = `${current.path}${key}`;
      if (typeof value !== "object") {
        const url = `${slash_url}${assetPath}`;
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

export class AssetCache {
  static requestAsset = requestAsset;
  static clearCache = () => db.clear();
  static cacheDir = () => CachePath;
  static fileSizeStr = fileSizeStr;
  static clearSizeResult = clearSizeResult;

  static preloadCache = preloadCache;
  static canPreloadCache = canPreloadCache;
}
