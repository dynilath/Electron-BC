import { Menu } from "electron";
import { scriptMenu } from "./script";
import { MyAppMenuConstructorOption } from "./type";
import { builtinMenu } from "./builtins";
import { aboutMenu } from "./about";
import { cacheMenu } from "./cache";
import { DoH } from "../DoH";

export function makeMenu(options: MyAppMenuConstructorOption) {
  const { refreshPage, parent } = options;

  const { window, i18n } = parent;

  return Menu.buildFromTemplate([
    {
      label: i18n("MenuItem::Tools"),
      id: "tools" as AppMenuIds,
      submenu: [
        {
          label: i18n("MenuItem::Tools::Refresh"),
          type: "normal",
          accelerator: "F5",
          click: () => refreshPage(),
        },
        {
          label: i18n("MenuItem::Tools::FullScreen"),
          type: "normal",
          accelerator: "F11",
          click: () => window.setFullScreen(!window.isFullScreen()),
        },
        {
          label: i18n("MenuItem::Tools::DevTools"),
          type: "normal",
          accelerator: "F12",
          click: () => window.webContents.toggleDevTools(),
        },
        {
          type: "separator",
        },
        ...cacheMenu(options),
        {
          type: "separator",
        },
        {
          label: i18n("MenuItem::Tools::OpenDoHConfigFile"),
          sublabel: i18n("MenuItem::Tools::DoHConfigTips"),
          type: "normal",
          click: () => DoH.openConfigFile(),
        },
        {
          type: "separator",
        },
        {
          label: i18n("MenuItem::Tools::Exit"),
          type: "normal",
          accelerator: "Alt+F4",
          click: () => window.close(),
        },
      ],
    },
    scriptMenu(options),
    builtinMenu(options),
    aboutMenu(options),
  ]);
}

export function popupMenu(
  id: AppMenuIds,
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
