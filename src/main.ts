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

  //mainWindow.webContents.executeJavaScript('CommonGetServer=()=>\'https://bondage-club-server.herokuapp.com/\';');

  SetMainWindow(mainWindow);

  ipcMain.on('reload-menu', () => {
    menu().then((v) => {
      Menu.setApplicationMenu(v);
    })
  })

  mainWindow.webContents.on('dom-ready', () => {
    ipcMain.emit('script-document-ready');
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

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on('load-script-url', (event, arg) => {
  const value = arg as string;
  ScriptManager.LoadFromURl(value, () => ipcMain.emit('reload-menu'));
});

ipcMain.on('language-change', (event, arg) => {
  updateLang(arg as string, () => ipcMain.emit('reload-menu'));
});