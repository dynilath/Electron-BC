import { app, BrowserWindow, ipcMain, Menu, session, powerSaveBlocker } from "electron";
import * as path from "path";
import { SetMainWindow } from "./MWContainer";
import menu from './memu'
import { ScriptManager } from "./SimpleScriptManager";
import { windowStateKeeper } from "./WindowState";
import { updateLang } from "./i18n";

let mainWindow: BrowserWindow | undefined;

function createWindow() {
  const winstate = new windowStateKeeper('main');

  mainWindow = new BrowserWindow({
    ...winstate.getBound(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "../BondageClub/BondageClub/Icons/Logo.png")
  });

  if (winstate.windowState.isMaximized)
    mainWindow.maximize()

  winstate.track(mainWindow);

  ScriptManager.LoadDataFolder();

  menu().then((v) => {
    Menu.setApplicationMenu(v);
  })

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders({ urls: ['*://*.herokuapp.com/*', 'wss://*.herokuapp.com/*'] },
    (details, callback) => {
      details.requestHeaders['Accept-Language'] = 'en-US';
      details.requestHeaders['Origin'] = 'https://www.bondageprojects.elementfx.com';
      callback({ requestHeaders: { ...details.requestHeaders } });
    },
  );

  mainWindow.loadFile(path.join(__dirname, "../BondageClub/BondageClub/index.html"));

  SetMainWindow(mainWindow);

  ipcMain.on('reload-menu', () => {
    menu().then((v) => {
      Menu.setApplicationMenu(v);
    })
  })

  mainWindow.webContents.on('dom-ready', () => {
    ScriptManager.LoadScript(true);
  });
}

app.whenReady().then(() => {
  createWindow();
  powerSaveBlocker.start('prevent-display-sleep');
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on('load-script-url', (event, arg) => {
  const value = arg as string;
  ScriptManager.LoadFromURl(value, () => ipcMain.emit('reload-menu'));
});

ipcMain.on('language-change', (event, arg) => {
  console.log('language-change', arg);
  updateLang(arg as string, () => ipcMain.emit('reload-menu'));
});