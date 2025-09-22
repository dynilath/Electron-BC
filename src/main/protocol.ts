import {
  ipcMain,
  net,
  protocol,
  shell,
  WindowOpenHandlerResponse,
} from 'electron'
import { readFileSync } from 'fs'
import path from 'path'
import {
  BCResourceHandler,
  EchoResourceHandler,
  MPAResourceHandler,
  ProtocolSetting,
} from './request'

export class MyProtocol {
  bcResource: BCResourceHandler
  echoResource: EchoResourceHandler
  mpaResource: MPAResourceHandler

  private async ebcHandler (request: Request) {
    const url = request.url.substring(6)
    const filePath = path.join(__dirname, url)
    try {
      const fileContent = readFileSync(filePath, 'utf-8')
      return new Response(fileContent, {
        status: 200,
        headers: { 'Content-Type': 'application/javascript' },
      })
    } catch (error) {
      return new Response('File not found', { status: 404 })
    }
  }

  private async httpsHandler (request: Request) {
    const bc_res_ctx = this.bcResource.willHandle(request)
    if (bc_res_ctx) {
      return this.bcResource.handle(request, bc_res_ctx)
    }

    const echo_res_ctx = this.echoResource.willHandle(request)
    if (echo_res_ctx) {
      return this.echoResource.handle(request, echo_res_ctx)
    }

    const mpa_res_ctx = this.mpaResource.willHandle(request)
    if (mpa_res_ctx) {
      return this.mpaResource.handle(request, mpa_res_ctx)
    }

    // console.log(`Fetching ${request.url} via net.fetch`)
    return net.fetch(request, { bypassCustomProtocolHandlers: true, redirect:"follow" })
  }

  constructor (readonly bcStatus?: ProtocolSetting[]) {
    this.bcResource = new BCResourceHandler(bcStatus)
    this.echoResource = new EchoResourceHandler()
    this.mpaResource = new MPAResourceHandler()

    protocol.handle('ebc', req => this.ebcHandler(req))
    protocol.handle('https', req => this.httpsHandler(req))
  }

  private static instance: MyProtocol | null = null

  static setBCStatus (bcStatus: ProtocolSetting[]) {
    if (this.instance) this.instance.bcResource.setBCStatus(bcStatus)
  }

  static init () {
    if (!this.instance) this.instance = new MyProtocol()
  }
}

export function windowOpenRequest (
  webContents: Electron.WebContents,
  url: string
): WindowOpenHandlerResponse {
  if (url === 'about:blank') {
    return { action: 'allow' }
  }

  if (url.endsWith('.user.js')) {
    ipcMain.emit('load-user-script', url)
    return { action: 'deny' }
  }

  shell.openExternal(url)
  return { action: 'deny' }
}
