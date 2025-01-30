import { app } from "electron";
import path from "path";
import { ClassicLevel } from "classic-level";
import { net } from "electron";

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

function queryAsset(key: string): Promise<CacheItem> {
  return db.get(key);
}

function clearCache() {
  return db.clear();
}

function cacheDir() {
  return CachePath;
}

function requestAsset(
  url: string,
  key: string,
  version: string
): Promise<CachedResponse> {
  return new Promise((resolve, reject) => {
    queryAsset(key).then(
      (data) => {
        if (data && data.version === version) {
          resolve({
            buffer: Buffer.from(data.base64Data, "base64"),
            type: data.type,
          });
        } else {
          net
            .fetch(url, { bypassCustomProtocolHandlers: true })
            .then(async (response) => ({
              buffer: Buffer.from(await response.arrayBuffer()),
              type: response.headers.get("Content-Type"),
            }))
            .then(({ buffer, type }) => {
              storeAsset(key, version, buffer, type);
              resolve({ buffer, type });
            });
        }
      },
      (error) => reject(error)
    );
  });
}

export class AssetCache {
  static requestAsset = requestAsset;
  static clearCache = clearCache;
  static cacheDir = cacheDir;
}
