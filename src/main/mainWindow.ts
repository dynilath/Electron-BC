import { BrowserWindow, ipcMain, Menu } from "electron";
import { StateKeptWindow } from "./WindowState";
import path from "path";
import { packageFile } from "./utility";
import { ContentLoadState } from "../handler";
import { windowOpenRequest } from "./protocol";
import { checkAndAnounce } from "./anouncer";
import { i18nText } from "../i18n";
import { popupMenu } from "./AppMenu/menu";
import { ScriptState } from "./script/state";
import { checkCacheVersion } from "./AssetCache/preloadCache";
import { MyPrompt } from "./MyPrompt";
import { AssetCache } from "./AssetCache";
import { MyAppMenu } from "./AppMenu";
import { Credential } from "./credential";

const icon = packageFile("Logo.ico");

function mainWindowAfterLoad(
  bcVersion: BCVersion,
  mainWindow: BrowserWindow,
  readyState: ContentLoadState
) {
  const i18ntext = new i18nText();

  const i18n = (tag: TextTag) => i18ntext.get(tag);

  readyState.loaded().then(async () => {
    const shouldUpdate = await checkCacheVersion(bcVersion);
    if (shouldUpdate) {
      MyPrompt.confirmCancel(
        { window: mainWindow, i18n },
        i18n("Alert::Cache::UpdateConfirm"),
        () => {
          AssetCache.preloadCache(bcVersion.url, bcVersion.version).then(() => {
            ipcMain.emit("reload-menu");
          });
          ipcMain.emit("reload-menu");
        }
      );
    }
  });

  const webContents = mainWindow.webContents;

  const scriptState = new ScriptState(webContents);

  const appMenu = new MyAppMenu({
    BCVersion: bcVersion,
    refreshPage: () => readyState.reload(),
    parent: { window: mainWindow, i18n },
    scriptState,
  });

  const reloadMenu = () => appMenu.emit("reload");

  const mReloadMenu = async (event: Electron.IpcMainEvent, webID?: number) => {
    if (webID === undefined || webID === webContents.id) reloadMenu();
  };

  const mLoadScriptURL = async (event: Electron.IpcMainEvent, url: string) => {
    if (event.sender.id === webContents.id)
      appMenu.once("reloaded", (menu) => {
        popupMenu("script", menu, mainWindow);
      });
  };

  const mLanguageChange = async (
    event: Electron.IpcMainEvent,
    lang: string
  ) => {
    if (event.sender.id === webContents.id) {
      console.log("language-change", lang);
      i18ntext.update(lang);
      reloadMenu();
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

  const onLogined = Credential.createOnLoginListener({
    window: mainWindow,
    i18n,
  });

  reloadMenu();
  ipcMain.on("reload-menu", mReloadMenu);
  ipcMain.on("load-script-url", mLoadScriptURL);
  ipcMain.on("language-change", mLanguageChange);
  ipcMain.on("credential-client-login", onLogined);

  mainWindow.on("close", () => {
    ipcMain.removeListener("reload-menu", mReloadMenu);
    ipcMain.removeListener("load-script-url", mLoadScriptURL);
    ipcMain.removeListener("language-change", mLanguageChange);
    ipcMain.removeListener("credential-client-login", onLogined);
    scriptState.dispose();
  });

  webContents.on("dom-ready", async () => {
    checkAndAnounce({ window: mainWindow, i18n });
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

async function makeMainWindow(bcVersion: BCVersion, winName: string) {
  const win = new StateKeptWindow(winName, {
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon,
  });

  const webContents = win.webContents;

  const { url, version } = bcVersion;

  const readyState = new ContentLoadState(webContents);

  win.loadURL(url);

  mainWindowAfterLoad({ url, version }, win.window, readyState);
}

export class MainWindowProvider {
  winCounter = 0;

  constructor(readonly bcVersion: BCVersion) {}

  async createWindow() {
    const winName = this.winCounter === 0 ? "main" : `main-${this.winCounter}`;
    await makeMainWindow(this.bcVersion, winName);
  }
}
