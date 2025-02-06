import { app, dialog, Menu, shell } from "electron";
import { openScriptFolder } from "./script";
import { openChangelog } from "./changelog";
import { EBCSetting } from "../settings";
import { AssetCache } from "./AssetCache";
import { MyPrompt } from "./MyPrompt";
import { createScriptMenu } from "./scriptMenu";
import { ScriptState } from "./script/state";
import { ScriptResource } from "./script/resource";
import { reloadAllMenu } from "./reloadAllMenu";
import { getCachePath } from "./AssetCache/cachePath";

type MenuIds = "script" | "tools";

export function makeMenu(
  BCVersion: { url: string; version: string },
  reloadMenu: () => void,
  reloadPage: () => Promise<any>,
  mainWindow: Electron.BrowserWindow,
  scriptState: ScriptState,
  i18n: (tag: TextTag) => string
) {
  return Menu.buildFromTemplate([
    {
      label: i18n("MenuItem::Tools"),
      id: "tools" as MenuIds,
      submenu: [
        {
          label: i18n("MenuItem::Tools::Refresh"),
          type: "normal",
          accelerator: "F5",
          click: () => reloadPage(),
        },
        {
          label: i18n("MenuItem::Tools::FullScreen"),
          type: "normal",
          accelerator: "F11",
          click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()),
        },
        {
          label: i18n("MenuItem::Tools::DevTools"),
          type: "normal",
          accelerator: "F12",
          click: () => mainWindow.webContents.toggleDevTools(),
        },
        {
          type: "separator",
        },
        {
          label: i18n("MenuItem::Tools::OpenCacheDir"),
          type: "normal",
          click: () => {
            shell.openPath(AssetCache.cacheDir());
          },
        },
        {
          label: i18n("MenuItem::Tools::RelocateCacheDir"),
          type: "normal",
          enabled: AssetCache.available(),
          click: () => {
            (async () => {
              try {
                const result = await dialog.showOpenDialog(mainWindow, {
                  properties: ["openDirectory"],
                  defaultPath: getCachePath(),
                });

                if (result.canceled) return;

                await AssetCache.relocate(
                  result.filePaths[0],
                  () => reloadAllMenu(),
                  () =>
                    new Promise((resolve) => {
                      MyPrompt.confirmCancel(
                        mainWindow.webContents,
                        "Alert::Cache::RelocateConfirm",
                        () => resolve(true),
                        () => resolve(false)
                      );
                    })
                );
                reloadAllMenu();
              } catch (e: any) {
                console.log(e);
                MyPrompt.error(mainWindow.webContents, e);
              }
            })();
          },
        },
        {
          label: i18n("MenuItem::Tools::StartUICacheUpdate"),
          type: "normal",
          enabled: AssetCache.canPreloadCache() && AssetCache.available(),
          ...(AssetCache.canPreloadCache()
            ? {}
            : {
                sublabel: i18n("MenuItem::Tools::StartUICacheUpdate::Loading"),
              }),
          click: () => {
            AssetCache.preloadCache(BCVersion.url, BCVersion.version).then(() =>
              reloadAllMenu()
            );
            reloadAllMenu();
          },
        },
        {
          label: i18n("MenuItem::Tools::ProximateCacheSize"),
          sublabel: AssetCache.fileSizeStr(),
          type: "normal",
          click: () => {
            AssetCache.clearSizeResult();
            reloadAllMenu();
          },
        },
        {
          label: i18n("MenuItem::Tools::ClearCache"),
          type: "normal",
          click: () => {
            MyPrompt.confirmCancel(
              mainWindow.webContents,
              "Alert::Cache::ClearConfirm",
              () => {
                AssetCache.clearCache();
              }
            );
          },
        },
        {
          type: "separator",
        },
        {
          label: i18n("MenuItem::Tools::Exit"),
          type: "normal",
          accelerator: "Alt+F4",
          click: () => mainWindow.close(),
        },
      ],
    },
    {
      label: i18n("MenuItem::Script"),
      id: "script" as MenuIds,
      submenu: [
        {
          label: i18n("MenuItem::Script::Load From URL"),
          type: "normal",
          sublabel: i18n("MenuItem::Script::InstallTips"),
          click: () => MyPrompt.loadUrl(mainWindow.webContents),
        },
        {
          label: i18n("MenuItem::Script::Open Script Folder"),
          type: "normal",
          click: () => openScriptFolder(),
        },
        {
          label: i18n("MenuItem::Script::UpdateScript"),
          type: "normal",
          click: () => ScriptResource.updateScripts(),
        },
        {
          type: "separator",
        },
        ...createScriptMenu(scriptState, reloadAllMenu, i18n),
      ],
    },
    {
      label: i18n("MenuItem::BuiltIns"),
      submenu: [
        {
          label: i18n("MenuItem::BuiltIns::Intro"),
          type: "normal",
          enabled: false,
        },
        {
          type: "separator",
        },
        {
          label: "🧩" + i18n("MenuItem::BuiltIns::CredentialSupport"),
          type: "checkbox",
          sublabel: i18n("MenuItem::BuiltIns::CredentialSupport::Info"),
          checked: EBCSetting.credentialSupport.get(),
          click: async () => {
            await EBCSetting.credentialSupport.toggle();
            reloadAllMenu();
          },
        },
        {
          label: "🧩" + i18n("MenuItem::BuiltIns::AutoRelog"),
          type: "checkbox",
          sublabel: i18n("MenuItem::BuiltIns::AutoRelog::Info"),
          checked: EBCSetting.autoRelogin.get(),
          enabled: EBCSetting.credentialSupport.get(),
          click: async () => {
            await EBCSetting.autoRelogin.toggle();
            reloadAllMenu();
          },
        },
      ],
    },
    {
      label: i18n("MenuItem::About"),
      submenu: [
        {
          label: i18n("MenuItem::About::BCVersion"),
          type: "normal",
          enabled: false,
          sublabel: BCVersion.version,
        },
        {
          label: i18n("MenuItem::About::Version"),
          type: "normal",
          enabled: false,
          sublabel: app.getVersion(),
        },
        {
          type: "separator",
        },
        {
          label: i18n("MenuItem::About::ChangeLog"),
          type: "normal",
          click: () => {
            openChangelog();
          },
        },
        {
          label: i18n("MenuItem::About::Suggestions"),
          type: "normal",
          click: () => {
            shell.openExternal(
              "https://github.com/dynilath/Electron-BC/issues"
            );
          },
        },
        {
          label: i18n("MenuItem::About::GitHub"),
          type: "normal",
          click: () => {
            shell.openExternal("https://github.com/dynilath/Electron-BC");
          },
        },
      ],
    },
  ]);
}

export function popupMenu(
  id: MenuIds,
  menu: Electron.Menu,
  window: Electron.BrowserWindow
) {
  const targetMenu = menu.getMenuItemById(id);
  if (!targetMenu) return;
  targetMenu.submenu?.popup({
    window,
    x: menu.items.indexOf(targetMenu) * 25,
    y: 0,
  });
}
