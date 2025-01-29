import { net } from "electron";
import { queryAsset, storeAsset } from "./level";

function fetchAndCacheAsset(
  url: string,
  key: string,
  version: string
): Promise<Buffer> {
  return net
    .fetch(url, { bypassCustomProtocolHandlers: true })
    .then((response) => response.arrayBuffer())
    .then((buffer) => {
      const bf = Buffer.from(buffer);
      storeAsset(key, version, bf);
      return bf;
    });
}

export function requestBCAsset(url: string, version: string): Promise<Buffer> {
  const assetKey = url.substring(url.lastIndexOf("BondageClub/") + 12);

  return new Promise((resolve, reject) => {
    queryAsset(assetKey).then(
      (data) => {
        if (data && data.version === version) {
          console.log(`Cache hit for [${assetKey}]`);
          resolve(Buffer.from(data.base64Data, "base64"));
        } else {
          console.log(
            `Cache miss for [${assetKey}], version ${version} != ${data?.version}`
          );
          resolve(fetchAndCacheAsset(url, assetKey, version));
        }
      },
      (error) => {
        if (error.notFound) {
          resolve(fetchAndCacheAsset(url, assetKey, version));
        } else {
          reject(error);
        }
      }
    );
  });
}
