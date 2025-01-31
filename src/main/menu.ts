import { app, Menu, shell } from "electron";
import { handler, newHandler } from "../handler";
import { accessMainWindow, getMainWindow } from "./MWContainer";
import { openScriptFolder, ScriptManager } from "../SimpleScriptManager";
import { i18n } from "../i18n";
import { showPromptLoadurl } from "./Prompts";
import { openChangelog } from "./changelog";
import { EBCSetting } from "../settings";
import { AssetCache } from "./AssetCache";
import { MyPrompt } from "../bridge/MyPrompt";

type MenuIds = "script" | "tools";

export function makeMenu() {
  return Menu.buildFromTemplate([
    {
      label: i18n("MenuItem::Tools"),
      id: "tools" as MenuIds,
      submenu: [
        {
          label: i18n("MenuItem::Tools::Refresh"),
          type: "normal",
          accelerator: "F5",
          click: () =>
            handler().then(async (h) => {
              h.send("reload");
              await newHandler();
              await ScriptManager.loadDataFolder();
              reloadMenu();
            }),
        },
        {
          label: i18n("MenuItem::Tools::FullScreen"),
          type: "normal",
          accelerator: "F11",
          click: () =>
            accessMainWindow((mw) => mw.setFullScreen(!mw.isFullScreen())),
        },
        {
          label: i18n("MenuItem::Tools::DevTools"),
          type: "normal",
          accelerator: "F12",
          click: () =>
            accessMainWindow((mw) => mw.webContents.toggleDevTools()),
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
          label: i18n("MenuItem::Tools::ProximateCacheSize"),
          sublabel: AssetCache.fileSizeStr(),
          type: "normal",
          click: () => {
            reloadMenu();
          },
        },
        {
          label: i18n("MenuItem::Tools::ClearCache"),
          type: "normal",
          click: () => {
            MyPrompt.sendConfirmCancel("Alert::Cache::ClearConfirm", () => {
              AssetCache.clearCache();
            });
          },
        },
        {
          type: "separator",
        },
        {
          label: i18n("MenuItem::Tools::Exit"),
          type: "normal",
          accelerator: "Alt+F4",
          click: () => accessMainWindow((mw) => mw.close()),
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
          click: () => showPromptLoadurl(),
        },
        {
          label: i18n("MenuItem::Script::Open Script Folder"),
          type: "normal",
          click: () => openScriptFolder(),
        },
        {
          label: i18n("MenuItem::Script::UpdateScript"),
          type: "normal",
          click: () => ScriptManager.updateAll().then(() => reloadMenu()),
        },
        {
          type: "separator",
        },
        ...Array.from(ScriptManager.scripts.values()).map((s) => {
          return {
            label: s.data.meta.name,
            type: "checkbox" as "checkbox",
            checked: s.data.setting.enabled,
            sublabel: (() => {
              const meta = s.data.meta;
              const sAuthor = i18n("MenuItem::Script::Author");
              const sVersion = i18n("MenuItem::Script::Version");
              const sURL = i18n("MenuItem::Script::URL");
              const sUnknown = i18n("MenuItem::Script::Unknown");
              return `${sAuthor}: ${meta.author ?? sUnknown}, ${sVersion}: ${
                meta.version ?? sUnknown
              },\n ${sURL}: ${s.data.setting.url ?? sUnknown}`;
            })(),
            click: () => ScriptManager.switchItem(s.data.meta.name),
          };
        }),
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
          click: () => {
            EBCSetting.credentialSupport.toggle().then(() => reloadMenu());
          },
        },
        {
          label: "🧩" + i18n("MenuItem::BuiltIns::AutoRelog"),
          type: "checkbox",
          sublabel: i18n("MenuItem::BuiltIns::AutoRelog::Info"),
          checked: EBCSetting.autoRelogin.get(),
          enabled: EBCSetting.credentialSupport.get(),
          click: () => EBCSetting.autoRelogin.toggle().then(() => reloadMenu()),
        },
      ],
    },
    {
      label: i18n("MenuItem::About"),
      submenu: [
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

export function reloadMenu() {
  Menu.setApplicationMenu(makeMenu());
}

export function popupMenu(id: MenuIds, window: Electron.BrowserWindow) {
  const menu = Menu.getApplicationMenu();
  if (!menu) return;
  const targetMenu = menu.getMenuItemById(id);
  if (!targetMenu) return;

  const windowBounds = window.getBounds();

  console.log("windowBounds", JSON.stringify(windowBounds));

  targetMenu.submenu?.popup({
    window,
    x: menu.items.indexOf(targetMenu) * 25,
    y: 0,
  });
}
