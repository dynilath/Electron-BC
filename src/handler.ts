import { ipcMain } from "electron";
import { BCURLPreference } from "./urlprefer";

const LoadedEvent = "page-loaded";

function handler(webContents: Electron.WebContents, then: () => void) {
  const ret = (event: Electron.IpcMainEvent) => {
    if (event.sender.id === webContents.id) {
      ipcMain.removeListener(LoadedEvent, ret);
      then();
    }
  };
  return ret;
}

export class ContentLoadState {
  private _loaded = false;
  constructor(readonly webContents: Electron.WebContents) {
    ipcMain.on(
      LoadedEvent,
      handler(webContents, () => {
        this._loaded = true;
      })
    );
  }

  loaded() {
    if (this._loaded) return Promise.resolve();
    return new Promise<void>((resolve) => {
      ipcMain.once(LoadedEvent, handler(this.webContents, resolve));
    });
  }

  reload() {
    this._loaded = false;
    this.webContents.loadURL(BCURLPreference.choice.url);
    console.log("Reload page");
    return new Promise<void>((resolve) => {
      ipcMain.once(LoadedEvent, handler(this.webContents, resolve));
    });
  }
}
