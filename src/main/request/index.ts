import { requestAssetResponse } from './utils'

export interface ResourceHandler<T extends object = object> {
  willHandle(request: Request): false | T
  handle(request: Request, context: T): Promise<Response>
}

export interface ProtocolSetting {
  url: string
  version: string
}

export class BCResourceHandler
  implements ResourceHandler<{ assetKey: string }>
{
  bcStatus?: ProtocolSetting[]
  constructor (bcStatus?: ProtocolSetting[]) {
    this.bcStatus = bcStatus
  }

  private assetKey (request: Request) {
    return request.url.substring(request.url.lastIndexOf('BondageClub/') + 12)
  }

  setBCStatus (bcStatus: ProtocolSetting[]) {
    this.bcStatus = bcStatus
  }

  willHandle (request: Request) {
    if (
      this.bcStatus &&
      this.bcStatus.some(s => request.url.startsWith(s.url))
    ) {
      const assetKey = this.assetKey(request)
      const idx = assetKey.lastIndexOf('.')
      const ext = idx === -1 ? '' : assetKey.substring(idx)
      if (['.png', '.jpg', '.mp3', '.txt', '.ttf'].includes(ext))
        return { assetKey }
    }
    return false
  }

  async handle (
    request: Request,
    { assetKey }: { assetKey: string }
  ): Promise<Response> {
    return requestAssetResponse(
      request.url,
      assetKey,
      this.bcStatus![0].version
    )
  }
}

export class EchoResourceHandler
  implements ResourceHandler<{ resource: string; version: string }>
{
  willHandle (request: Request) {
    const urls = [
      'https://emdsa2.github.io/-mod/',
      'https://sugarchain-studio.github.io/echo-clothing-ext/',
      'https://sugarchain-studio.github.io/echo-activity-ext/',
    ]
    const url = urls.find(u => request.url.startsWith(u))
    if (!url) return false
    const [resource, args] = request.url.substring(url.length).split('?', 2)
    if (args === undefined) return false

    if (
      resource.endsWith('.png') ||
      resource.endsWith('.jpg') ||
      resource.endsWith('.webp')
    ) {
      const v_start = args.indexOf('v=')
      const version = args.substring(
        v_start + 2,
        Math.min(v_start + 9, args.length)
      )
      return { resource, version }
    }
    return false
  }

  handle (
    request: Request,
    { resource, version }: { resource: string; version: string }
  ): Promise<Response> {
    return requestAssetResponse(request.url, `EchoMod://${resource}`, version)
  }
}

export class MPAResourceHandler
  implements ResourceHandler<{ version: string }>
{
  willHandle (request: Request) {
    if (
      request.url.startsWith('https://mayathefoxy.github.io/MPA/assets/') &&
      request.url.endsWith('.mp3')
    ) {
      const parts = request.url.split('/')
      const version = parts[parts.length - 1]
      return { version }
    }
    return false
  }

  handle (
    request: Request,
    { version }: { version: string }
  ): Promise<Response> {
    return requestAssetResponse(request.url, `MPA://${request.url}`, version)
  }
}
