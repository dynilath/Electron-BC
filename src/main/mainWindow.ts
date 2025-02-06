import { BrowserWindow, ipcMain, Menu } from "electron";
import { windowStateKeeper } from "./WindowState";
import path from "path";
import { packageFile } from "./utility";
import { ContentLoadState } from "../handler";
import { windowOpenRequest } from "./protocol";
import { checkAndAnounce } from "./anouncer";
import { i18n, updateLang } from "../i18n";
import { makeMenu, popupMenu } from "./menu";
import { PreloadCacheSetting } from "./preloadCacheSetting";
import { ScriptState } from "./script/state";

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

async function makeMainWindow(bcVersion: BCVersion, winName: string) {
  const winstate = new windowStateKeeper(winName);

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

  const webContents = mainWindow.webContents;

  const { url, version } = bcVersion;

  const readyState = new ContentLoadState(webContents);

  mainWindow.loadURL(url);

  mainWindowAfterLoad({ url, version }, mainWindow, readyState);
}

export class MainWindowProvider {
  winCounter = 0;

  constructor(readonly bcVersion: BCVersion) {}

  async createWindow() {
    const winName = this.winCounter === 0 ? "main" : `main-${this.winCounter}`;
    await makeMainWindow(this.bcVersion, winName);
  }
}
