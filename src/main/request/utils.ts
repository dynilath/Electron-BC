import { AssetCache } from "../AssetCache"

export async function requestAssetResponse (
  ...args: Parameters<typeof AssetCache.requestAsset>
) {
  const { content, type } = await AssetCache.requestAsset(...args)
  return new Response(content, {
    status: 200,
    statusText: 'OK',
    headers: {
      ...(type ? { 'Content-Type': type } : {}),
      'Content-Length': content.size.toString(),
    },
  })
}