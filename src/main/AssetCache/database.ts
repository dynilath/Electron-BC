import { ClassicLevel } from "classic-level";
import { net } from "electron";
import { getCachePath, relocateCachePath } from "./cachePath";
import { PendingAccess } from "../utility";

interface CachedResponse {
  content: Blob;
  type: string | null;
}

interface CacheItem {
  base64Data: string;
  version: string;
  type: string | null;
  cacheTime: number;
}

function createDatabase() {
  return new ClassicLevel<string, CacheItem>(getCachePath(), {
    valueEncoding: "json",
  });
}

let access: PendingAccess<ClassicLevel<string, CacheItem>> | undefined =
  undefined;

export async function initAccess() {
  access = new PendingAccess(createDatabase());
  await access.aquire();
}

export async function storeAsset(
  key: string,
  version: string,
  data: Buffer,
  type: string | null
) {
  const db = await access!.aquire();

  return db
    .put(key, {
      base64Data: data.toString("base64"),
      version,
      type,
      cacheTime: Date.now(),
    })
    .catch((error) => {
      console.error(`Failed to store asset ${key}: ${error}`);
    });
}

export async function fetchAsset(url: string): Promise<CachedResponse> {
  const response = await net.fetch(url, { bypassCustomProtocolHandlers: true });
  return { content: await response.blob(), type: response.headers.get("Content-Type") };
}

export async function requestAsset(
  url: string,
  key: string,
  version: string
): Promise<CachedResponse> {
  const db = await access!.aquire();
  const data = await db.get(key);
  if (data && data.version === version) {
    return {
      content: new Blob([Buffer.from(data.base64Data, "base64")]),
      type: data.type,
    };
  } else {
    const { content, type } = await fetchAsset(url);
    storeAsset(key, version, Buffer.from(await content.arrayBuffer()), type);
    return { content, type };
  }
}

export async function aquire() {
  const db = await access!.aquire();
  return db;
}

export async function clear() {
  const db = await access!.aquire();
  return db.clear();
}

export async function relocate(
  newPath: string,
  copyStart: () => void,
  copyConfirm: () => boolean | PromiseLike<boolean>
) {
  const olddb = access!.invalidate();
  copyStart();
  if (olddb) await olddb.close();
  await relocateCachePath(newPath, copyConfirm);
  access!.release(createDatabase());
}

export function available() {
  return access!.test();
}