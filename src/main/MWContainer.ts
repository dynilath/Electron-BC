import { BrowserWindow } from "electron";

let mainWindow: BrowserWindow | undefined = undefined;

export function setMainWindow(win: BrowserWindow) {
  mainWindow = win;
}

export function getMainWindow() {
  return mainWindow;
}

export function accessMainWindow(callback: (mw: BrowserWindow) => void) {
  if (mainWindow) {
    callback(mainWindow);
  }
}