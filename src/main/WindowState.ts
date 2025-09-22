import { BrowserWindow } from 'electron'
import settings from 'electron-settings'

type WinStateType = {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized?: boolean
}

function _bounds (windowName: string): WinStateType | null {
  return settings.getSync(`windowState.${windowName}`) as WinStateType | null
}

function _save (windowName: string, windowState: WinStateType) {
  settings.setSync(`windowState.${windowName}`, windowState)
}

export class StateKeptWindow {
  windowState: WinStateType
  window: BrowserWindow

  constructor (
    readonly windowName: string,
    readonly option?: Electron.BrowserWindowConstructorOptions
  ) {
    const bounds = _bounds(windowName) || {
      width: 1000,
      height: 800,
    }
    const nOption = Object.assign(option || {}, bounds)
    this.window = new BrowserWindow(nOption)
    if (bounds.isMaximized) this.window.maximize()
    this.windowState = bounds
    const save = () => {
      this.windowState = this.window.getBounds()
      this.windowState.isMaximized = this.window.isMaximized()
      _save(windowName, this.windowState)
    }
    this.window.on('resize', save)
    this.window.on('move', save)
    this.window.on('close', save)
  }

  get webContents () {
    return this.window.webContents
  }

  loadURL (...args: Parameters<BrowserWindow['loadURL']>) {
    this.window.loadURL(...args)
  }

  loadFile (...args: Parameters<BrowserWindow['loadFile']>) {
    this.window.loadFile(...args)
  }

  on (...args: Parameters<BrowserWindow['on']>) {
    this.window.on(...args)
  }

  close () {
    this.window.close()
  }
}
