import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { PromptOptions } from "./types";

export function showPrompt(
  parent: BrowserWindow,
  options: PromptOptions
): Promise<any> {
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      width: 480,
      height: 240,
      minWidth: 320,
      minHeight: 120,
      resizable: true,
      frame: false,
      minimizable: false,
      maximizable: false,
      parent: parent,
      modal: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, "prompt_preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    // win.webContents.toggleDevTools();
    win.removeMenu();
    win.loadFile(path.join(app.getAppPath(), "resource/prompt.html"));
    win.once("ready-to-show", () => win.show());
    win.webContents.once("did-finish-load", () => {
      win.webContents.send("prompt-data", options);
    });
    const handler: Parameters<typeof ipcMain.on>[1] = (_e, result) => {
      if (_e.sender.id !== win.webContents.id) return;
      resolve(result);
      win.close();
    };
    ipcMain.once("prompt-result", handler);

    ipcMain.on("log", (_e, data) => {
      if (_e.sender.id !== win.webContents.id) return;
      console.log("render log", data);
    });
  });
}
