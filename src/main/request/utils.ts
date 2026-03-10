import { AssetCache } from '../AssetCache';

export async function requestAssetResponse(
  ...args: Parameters<typeof AssetCache.requestAsset>
) {
  const { content, type, version } = await AssetCache.requestAsset(...args);
  return new Response(content, {
    status: 200,
    statusText: 'OK',
    headers: {
      ...(type ? { 'Content-Type': type } : {}),
      'Content-Length': content.size.toString(),
      ...(version
        ? { 'X-Local-Cache': 'HIT', 'X-Local-Cache-Version': version }
        : {}),
    },
  });
}

export async function requestAssetResponsePermanent(
  ...args: Parameters<typeof AssetCache.requestAsset>
) {
  const { content, type, version } = await AssetCache.requestAsset(...args);
  return new Response(content, {
    status: 200,
    statusText: 'OK',
    headers: {
      ...(type ? { 'Content-Type': type } : {}),
      'Content-Length': content.size.toString(),
      ...(version
        ? {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'X-Local-Cache': 'HIT',
            'X-Local-Cache-Version': version,
          }
        : {}),
    },
  });
}
