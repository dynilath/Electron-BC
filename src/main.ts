import { app, BrowserWindow, ipcMain, Menu, powerSaveBlocker } from "electron";
import * as path from "path";
import { makeMenu, popupMenu } from "./main/menu";
import { reloadAllMenu } from "./main/reloadAllMenu";
import { windowStateKeeper } from "./main/WindowState";
import { i18n, updateLang } from "./i18n";
import { autoUpdater } from "electron-updater";
import { Credential } from "./main/credential";
import { packageFile, fetchLatestBC } from "./main/utility";
import { MyProtocol, windowOpenRequest } from "./main/protocol";
import { checkAndAnounce } from "./main/anouncer";
import { MyPrompt } from "./main/MyPrompt";
import { PreloadCacheSetting } from "./main/preloadCacheSetting";
import { ContentLoadState } from "./handler";
import { ScriptState } from "./main/script/state";
import { ScriptResource } from "./main/script/resource";

const DeltaUpdater = require("@electron-delta/updater");

const icon = packageFile("Logo.ico");

function mainWindowAfterLoad(
  bcVersion: { url: string; version: string },
  mainWindow: BrowserWindow,
  readyState: ContentLoadState
) {
  readyState.loaded().then(() => {
    PreloadCacheSetting.check(webContents, bcVersion);
  });

  const webContents = mainWindow.webContents;

  const scriptState = new ScriptState(webContents);

  const reloadListener = [] as ((menu: Electron.Menu) => void)[];

  const reloadMenu = (webID?: number) => {
    if (webID && webID !== webContents.id) return;

    const menu = makeMenu(
      bcVersion,
      () => reloadMenu(),
      () => readyState.reload(),
      mainWindow,
      scriptState
    );
    mainWindow.setMenu(menu);
    reloadListener.forEach((i) => i(menu));
    reloadListener.length = 0;
  };

  const reloadMenuEvent = async (
    event: Electron.IpcMainEvent,
    webID?: number
  ) => {
    reloadMenu(webID);
  };

  const loadScriptURL = async (event: Electron.IpcMainEvent, url: string) => {
    if (event.sender.id === webContents.id)
      reloadListener.push((menu) => popupMenu("script", menu, mainWindow));
  };

  const languageChange = async (event: Electron.IpcMainEvent, lang: string) => {
    if (event.sender.id === webContents.id) {
      console.log("language-change", lang);
      updateLang(lang).then(reloadMenu);
    }
  };

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
  ipcMain.on("reload-menu", reloadMenuEvent);
  ipcMain.on("load-script-url", loadScriptURL);
  ipcMain.on("language-change", languageChange);

  mainWindow.on("close", () => {
    ipcMain.removeListener("reload-menu", reloadMenuEvent);
    ipcMain.removeListener("load-script-url", loadScriptURL);
    ipcMain.removeListener("language-change", languageChange);
  });

  webContents.on("dom-ready", async () => {
    checkAndAnounce(webContents);
    await readyState.loaded();
    await scriptState.loadScript();
    reloadMenu();
  });

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

async function createWindow(name: string) {
  const winstate = new windowStateKeeper(name);

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
    MyProtocol.setBCStatus({ url, version });
    mainWindow.loadURL(url);
    mainWindowAfterLoad({ url, version }, mainWindow, readyState);
  } catch (error) {
    console.error(error);
    webContents.send("electron-bc-loading", {
      type: "error",
      message: `${error}`,
    });
  }
}

let windowCount = 0;

app.whenReady().then(async () => {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  const deltaUpdater = new DeltaUpdater({
    autoUpdater,
  });

  try {
    await deltaUpdater.boot({ splashScreen: true });
  } catch (error) {
    console.error(error);
  }

  ScriptResource.init();
  MyProtocol.init();
  Credential.init();
  MyPrompt.init();

  createWindow("main");
  windowCount += 1;

  powerSaveBlocker.start("prevent-display-sleep");
});

app.on("second-instance", () => {
  const name = `main-${windowCount}`;
  windowCount += 1;
  createWindow(name);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("ready", function () {
  autoUpdater.checkForUpdatesAndNotify();
});
