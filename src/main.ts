import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  powerSaveBlocker,
  shell,
} from "electron";
import * as path from "path";
import { SetMainWindow } from "./main/MWContainer";
import { popupMenu, reloadMenu } from "./main/memu";
import { ScriptManager } from "./SimpleScriptManager";
import { windowStateKeeper } from "./main/WindowState";
import { i18n, updateLang } from "./i18n";
import { autoUpdater } from "electron-updater";
import { initCredentialHandler } from "./main/credential";

const DeltaUpdater = require("@electron-delta/updater");

let mainWindow: BrowserWindow | undefined;

function createWindow() {
  const winstate = new windowStateKeeper("main");

  mainWindow = new BrowserWindow({
    ...winstate.getBound(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "../BondageClub/BondageClub/Icons/Logo.png"),
  });

  if (winstate.windowState.isMaximized) mainWindow.maximize();

  winstate.track(mainWindow);

  ScriptManager.loadDataFolder();
  ipcMain.on("load-script-done", (event, arg) =>
    ScriptManager.onScriptLoaded(arg as string)
  );

  reloadMenu();

  mainWindow.webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ["*://*.herokuapp.com/*", "wss://*.herokuapp.com/*"] },
    (details, callback) => {
      details.requestHeaders["Accept-Language"] = "en-US";
      details.requestHeaders["Origin"] =
        "https://www.bondageprojects.elementfx.com";
      callback({ requestHeaders: { ...details.requestHeaders } });
    }
  );

  mainWindow.loadFile(
    path.join(__dirname, "../BondageClub/BondageClub/index.html")
  );

  SetMainWindow(mainWindow);

  ipcMain.on("reload-menu", () => reloadMenu());

  ipcMain.on("load-script-url", (event, arg) => {
    const value = arg as string;
    ScriptManager.loadOneFromURL(value).then(() => {
      reloadMenu();
      if (mainWindow) popupMenu("script", mainWindow);
    });
  });

  ipcMain.on("language-change", (event, arg) => {
    console.log("language-change", arg);
    updateLang(arg as string).then(() => ipcMain.emit("reload-menu"));
  });

  initCredentialHandler();

  mainWindow.webContents.on("dom-ready", () => {
    ScriptManager.loadScript(true);
  });

  mainWindow.webContents.on("context-menu", (event, params) => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: i18n("ContextMenu::Cut"),
        role: "cut",
        accelerator: "CmdOrCtrl+X",
      },
      {
        label: i18n("ContextMenu::Copy"),
        role: "copy",
        accelerator: "CmdOrCtrl+C",
      },
      {
        label: i18n("ContextMenu::Paste"),
        role: "paste",
        accelerator: "CmdOrCtrl+V",
      },
    ]);
    contextMenu.popup({ window: mainWindow, x: params.x, y: params.y });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url === "about:blank") return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-prevent-unload", (event) => {
    return event.preventDefault();
  });
}

app.whenReady().then(async () => {
  createWindow();
  powerSaveBlocker.start("prevent-display-sleep");
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  const deltaUpdater = new DeltaUpdater({
    autoUpdater,
  });
  try {
    await deltaUpdater.boot({ splashScreen: true });
  } catch (error) {
    console.error(error);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("ready", function () {
  autoUpdater.checkForUpdatesAndNotify();
});
