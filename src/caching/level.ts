import { app } from "electron";
import path from "path";
import { ClassicLevel } from "classic-level";
import { CacheItem } from "./type";

const Cache = path.join(app.getPath("appData"), "Bondage Club", "AssetCache");

const db = new ClassicLevel<string, CacheItem>(Cache, {
  valueEncoding: "binary",
});

export function storeAsset(key: string, version: string, data: Buffer) {
  console.log(
    `Storing asset ${key}, version ${version}, dataLen: ${data.length}`
  );
  db.put(key, {
    base64Data: data.toString("base64"),
    version,
    cacheTime: Date.now(),
  }).catch((error) => {
    console.error(`Failed to store asset ${key}: ${error}`);
  });
}

export function queryAsset(key: string): Promise<CacheItem> {
  return db.get(key);
}
