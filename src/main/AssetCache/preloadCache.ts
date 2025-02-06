import fs from "fs";
import LZString from "lz-string";
import { aquire, fetchAsset, storeAsset } from "./database";
import { packageFile } from "../utility";

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
