import { app, shell } from "electron";
import { MyAppMenuConstructorOption } from "./type";
import { openChangelog } from "../changelog";

export function aboutMenu({
  BCVersion,
  parent,
}: MyAppMenuConstructorOption): Electron.MenuItemConstructorOptions {
  const { i18n } = parent;
  return {
    label: i18n("MenuItem::About"),
    submenu: [
      {
        label: BCVersion.url,
        type: "normal",
        enabled: false,
      },
      {
        type: "separator",
      },
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
          shell.openExternal("https://github.com/dynilath/Electron-BC/issues");
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
  };
}
