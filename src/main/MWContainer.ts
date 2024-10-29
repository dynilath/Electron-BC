import { BrowserWindow } from "electron";

let mainWindow: BrowserWindow | undefined = undefined;

export function SetMainWindow(win: BrowserWindow) {
    mainWindow = win;
}

export function GetMainWindow() {
    return mainWindow;
}