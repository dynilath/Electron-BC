import { app, BrowserWindow, ipcMain, Menu, powerSaveBlocker } from "electron";
import * as path from "path";
import { makeMenu, popupMenu } from "./main/menu";
import { ScriptManager } from "./SimpleScriptManager";
import { windowStateKeeper } from "./main/WindowState";
import { i18n, updateLang } from "./i18n";
import { autoUpdater } from "electron-updater";
import { Credential } from "./main/credential";
import { fetchLatestBC } from "./utility";
import { setupProtocol, windowOpenRequest } from "./main/protocol";
import { checkAndAnounce } from "./main/anouncer";
import { MyPrompt } from "./main/MyPrompt";
import { PreloadCacheSetting } from "./main/preloadCacheSetting";
import { ContentLoadState } from "./handler";
const DeltaUpdater = require("@electron-delta/updater");

const icon = path.join(__dirname, "../BondageClub/BondageClub/Icons/Logo.png");

function mainWindowAfterLoad(
  bcVersion: { url: string; version: string },
  mainWindow: BrowserWindow,
  readyState: ContentLoadState
) {
  readyState.loaded().then(() => {
    PreloadCacheSetting.check(webContents, bcVersion);
  });

  ScriptManager.loadDataFolder();

  ipcMain.on("load-script-done", (event, arg) =>
    ScriptManager.onScriptLoaded(arg as string)
  );

  const webContents = mainWindow.webContents;

  const reloadMenu = () => {
    const menu = makeMenu(
      bcVersion,
      () => reloadMenu(),
      () => readyState.reload(),
      mainWindow
    );
    mainWindow.setMenu(menu);
  };

  webContents.session.webRequest.onBeforeSendHeaders(
    { urls: ["*://*.herokuapp.com/*", "wss://*.herokuapp.com/*"] },
    (details, callback) => {
      details.requestHeaders["Accept-Language"] = "en-US";
      details.requestHeaders["Origin"] =
        "https://www.bondageprojects.elementfx.com";
      callback({ requestHeaders: { ...details.requestHeaders } });
    }
  );

  reloadMenu();
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

  webContents.on("dom-ready", () => {
    checkAndAnounce(webContents);
    readyState.loaded().then(() => {
      ScriptManager.loadScript(webContents, true);
    });
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

  webContents.on("context-menu", (event, params) => {
    makeContextMenu().popup({ window: mainWindow, x: params.x, y: params.y });
  });

  webContents.setWindowOpenHandler(({ url }) =>
    windowOpenRequest(webContents, url)
  );

  webContents.on("did-create-window", (window) => {
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

  webContents.on("will-prevent-unload", (event) => {
    return event.preventDefault();
  });
}

async function createWindow() {
  const winstate = new windowStateKeeper("main");

  const mainWindow = new BrowserWindow({
    ...winstate.getBound(),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon,
  });

  if (winstate.windowState.isMaximized) mainWindow.maximize();

  winstate.track(mainWindow);

  mainWindow.removeMenu();
  await mainWindow.loadFile("resource/loading.html");
  const webContents = mainWindow.webContents;
  try {
    const { url, version } = await fetchLatestBC();

    const readyState = new ContentLoadState(webContents);

    webContents.send("electron-bc-loading", {
      type: "done",
      message: `BC version: ${version}`,
    });

    console.log(`BC version: ${version}`);
    setupProtocol({ urlPrefix: url, version });
    mainWindow.loadURL(url);
    mainWindowAfterLoad({ url, version }, mainWindow, readyState);
  } catch (error) {
    webContents.send("electron-bc-loading", {
      type: "error",
      message: `${error}`,
    });
  }
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

  Credential.init();
  MyPrompt.init();

  createWindow();

  powerSaveBlocker.start("prevent-display-sleep");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("ready", function () {
  autoUpdater.checkForUpdatesAndNotify();
});
