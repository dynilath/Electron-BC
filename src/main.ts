import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  powerSaveBlocker,
  shell,
} from "electron";
import * as path from "path";
import { setMainWindow } from "./main/MWContainer";
import { popupMenu, reloadMenu } from "./main/menu";
import { ScriptManager } from "./SimpleScriptManager";
import { windowStateKeeper } from "./main/WindowState";
import { i18n, updateLang } from "./i18n";
import { autoUpdater } from "electron-updater";
import { initCredentialHandler } from "./main/credential";
import { fileURLToPath } from "url";
import { showPromptLoadurl } from "./main/Prompts";

const DeltaUpdater = require("@electron-delta/updater");

const icon = path.join(__dirname, "../BondageClub/BondageClub/Icons/Logo.png");
const changlogPath = path.join(
  __dirname,
  "../BondageClub/BondageClub/changelog.html"
);

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
    icon,
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

  setMainWindow(mainWindow);

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

  const makeContextMenu = () =>
    Menu.buildFromTemplate([
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

  mainWindow.webContents.on("context-menu", (event, params) => {
    makeContextMenu().popup({ window: mainWindow, x: params.x, y: params.y });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url === "about:blank" ||
      (url.startsWith("file://") && fileURLToPath(url) === changlogPath)
    ) {
      return { action: "allow" };
    }

    if (url.endsWith(".user.js")) {
      showPromptLoadurl(url);
      return { action: "deny" };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("did-create-window", (window) => {
    window.removeMenu();
    window.webContents.on("context-menu", (event, params) => {
      makeContextMenu().popup({
        window,
        x: params.x,
        y: params.y,
      });
    });
    window.setIcon(icon);
  });

  mainWindow.webContents.on("will-prevent-unload", (event) => {
    return event.preventDefault();
  });
}

app.whenReady().then(async () => {
  const deltaUpdater = new DeltaUpdater({
    autoUpdater,
  });

  try {
    await deltaUpdater.boot({ splashScreen: true });
  } catch (error) {
    console.error(error);
  }

  createWindow();
  powerSaveBlocker.start("prevent-display-sleep");
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("ready", function () {
  autoUpdater.checkForUpdatesAndNotify();
});
