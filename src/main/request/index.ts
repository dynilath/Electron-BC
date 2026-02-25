import { requestAssetResponse } from './utils';

export interface ResourceHandler<T extends object = object> {
  willHandle(request: Request): false | T;
  handle(request: Request, context: T): Promise<Response>;
}

export interface ProtocolSetting {
  url: string;
  version: string;
}

export class BCResourceHandler implements ResourceHandler<{
  assetKey: string;
}> {
  bcStatus?: ProtocolSetting[];
  constructor(bcStatus?: ProtocolSetting[]) {
    this.bcStatus = bcStatus;
  }

  private assetKey(request: Request) {
    return request.url.substring(request.url.lastIndexOf('BondageClub/') + 12);
  }

  setBCStatus(bcStatus: ProtocolSetting[]) {
    this.bcStatus = bcStatus;
  }

  willHandle(request: Request) {
    if (
      this.bcStatus &&
      this.bcStatus.some(s => request.url.startsWith(s.url))
    ) {
      const assetKey = this.assetKey(request);
      const idx = assetKey.lastIndexOf('.');
      const ext = idx === -1 ? '' : assetKey.substring(idx);
      if (['.png', '.jpg', '.mp3', '.txt', '.ttf'].includes(ext))
        return { assetKey };
    }
    return false;
  }

  async handle(
    request: Request,
    { assetKey }: { assetKey: string }
  ): Promise<Response> {
    return requestAssetResponse(
      request.url,
      assetKey,
      this.bcStatus![0].version
    );
  }
}

export class EchoResourceHandler implements ResourceHandler<{
  resource: string;
  version: string;
}> {
  willHandle(request: Request) {
    const urls = [
      'https://sugarchain-studio.github.io/echo-clothing-ext/',
      'https://sugarchain-studio.github.io/echo-activity-ext/',
      'https://cdn.jsdelivr.net/gh/SugarChain-Studio/echo-clothing-ext@',
      'https://cdn.jsdelivr.net/gh/SugarChain-Studio/echo-activity-ext@',
    ];
    const base_url = urls.find(u => request.url.startsWith(u));
    if (!base_url) return false;

    let resource, version;

    if (base_url.startsWith('https://sugarchain-studio.github.io/')) {
      const vIdx = request.url.indexOf('?v=');
      resource = request.url.substring(base_url.length, vIdx);
      version = request.url.substring(vIdx + 3);
    } else if (
      base_url.startsWith('https://cdn.jsdelivr.net/gh/SugarChain-Studio/')
    ) {
      // https://cdn.jsdelivr.net/gh/SugarChain-Studio/echo-clothing-ext@abcedf1234567890/resources/Path.png
      // '/resources/' is not part of resource url
      const separator = '/resources/';
      const shaEnd = request.url.indexOf(separator, base_url.length);
      if (shaEnd === -1) return false;
      version = request.url.substring(base_url.length, shaEnd);
      resource = request.url.substring(
        base_url.length + version.length + separator.length
      );
    }

    if (!resource || !version) return false;

    if (
      resource.endsWith('.png') ||
      resource.endsWith('.jpg') ||
      resource.endsWith('.webp')
    ) {
      return { resource, version };
    }
    return false;
  }

  handle(
    request: Request,
    { resource, version }: { resource: string; version: string }
  ): Promise<Response> {
    return requestAssetResponse(request.url, `EchoMod://${resource}`, version);
  }
}

export class MPAResourceHandler implements ResourceHandler<{
  version: string;
}> {
  willHandle(request: Request) {
    if (
      request.url.startsWith('https://mayathefoxy.github.io/MPA/assets/') &&
      request.url.endsWith('.mp3')
    ) {
      const parts = request.url.split('/');
      const version = parts[parts.length - 1];
      return { version };
    }
    return false;
  }

  handle(
    request: Request,
    { version }: { version: string }
  ): Promise<Response> {
    return requestAssetResponse(request.url, `MPA://${request.url}`, version);
  }
}
