import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

export type PromptType = 'input' | 'confirmCancel' | 'info';

export interface PromptOptions {
  type: PromptType;
  inputPlaceholder?: string;
  inputType?: 'userscript' | 'url';
  inputError?: string;
  title?: string;
  message?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
}

export function showPrompt(options: PromptOptions): Promise<any> {
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
      parent: BrowserWindow.getFocusedWindow() || undefined,
      modal: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, "prompt_preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    win.webContents.toggleDevTools();
    win.removeMenu();
    win.loadFile(path.join(app.getAppPath(), 'resource/prompt.html'));
    win.once('ready-to-show', () => win.show());
    win.webContents.once('did-finish-load', () => {
      win.webContents.send('prompt-data', options);
    });
    const handler = (_e: any, result: any) => {
      resolve(result);
      ipcMain.removeListener('prompt-result', handler);
      win.close();
    };
    ipcMain.on('prompt-result', handler);

    ipcMain.on('log', (_e: any, data: any) => {
      console.log("render log", data);
    });
  });
}
