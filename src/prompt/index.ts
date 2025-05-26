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
      resizable: true,
      frame: false,
      minimizable: false,
      maximizable: false,
      parent: parent,
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
    const cb_result: Parameters<typeof ipcMain.on>[1] = (_e, result) => {
      if (_e.sender.id !== win.webContents.id) return;
      resolve(result);
      win.close();
    };
    ipcMain.on("prompt-result", cb_result);

    const cb_log: Parameters<(typeof ipcMain)["on"]>[1] = (_e, data) => {
      if (_e.sender.id !== win.webContents.id) return;
      console.log("render log", data);
    };

    ipcMain.on("log", cb_log);

    const cb_resize: Parameters<(typeof ipcMain)["on"]>[1] = (
      e,
      { width, height }
    ) => {
      if (e.sender.id !== win.webContents.id) return;
      console.log("resize", width, height);
      win.setSize(width, height);
      win.center();
    };
    ipcMain.on("prompt-resize", cb_resize);

    win.on("blur", () => {
      if (!win.isDestroyed()) {
        resolve({ ok: false, value: undefined });
        win.close();
      }
    });

    win.once("closed", () => {
      ipcMain.removeListener("prompt-result", cb_result);
      ipcMain.removeListener("log", cb_log);
      ipcMain.removeListener("prompt-resize", cb_resize);
    });
  });
}
