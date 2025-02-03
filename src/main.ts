import { app, BrowserWindow, ipcMain, Menu, powerSaveBlocker } from "electron";
import * as path from "path";
import { makeMenu, popupMenu } from "./main/menu";
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

  const reloadMenu = () => {
    const menu = makeMenu(
      bcVersion,
      () => reloadMenu(),
      () => readyState.reload(),
      mainWindow,
      scriptState
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

  ipcMain.on("load-script-url", async (event, url: string) => {
    const script = await ScriptResource.loadScriptFromUrl(url);
    await scriptState.loadOneScript(script);
    reloadMenu();
    popupMenu("script", mainWindow);
  });

  ipcMain.on("language-change", (event, arg) => {
    console.log("language-change", arg);
    updateLang(arg as string).then(() => ipcMain.emit("reload-menu"));
  });

  webContents.on("dom-ready", async () => {
    checkAndAnounce(webContents);
    await readyState.loaded();
    await scriptState.loadScript();
    reloadMenu();
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
