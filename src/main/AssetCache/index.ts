import { canPreloadCache, preloadCache } from "./preloadCache";
import { clearSizeResult, fileSizeStr, getCachePath } from "./cachePath";
import { requestAsset, relocate, clear } from "./database";

export class AssetCache {
  static requestAsset = requestAsset;
  static clearCache = clear;
  static cacheDir = getCachePath;
  static fileSizeStr = fileSizeStr;
  static clearSizeResult = clearSizeResult;

  static preloadCache = preloadCache;
  static canPreloadCache = canPreloadCache;

  static relocate = relocate;
}
