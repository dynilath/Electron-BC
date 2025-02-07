import { MyPrompt } from "../MyPrompt";
import { reloadAllMenu } from "../reloadAllMenu";
import { openScriptFolder } from "../script";
import { ScriptResource } from "../script/resource";
import { MyAppMenuConstructorOption } from "./type";

export function scriptMenu({
  mainWindow,
  scriptState,
  i18n,
}: MyAppMenuConstructorOption): Electron.MenuItemConstructorOptions {
  const scriptMenu = scriptState.menuItems.reduce((pv, cv) => {
    if (!pv[cv.scriptName]) {
      pv[cv.scriptName] = [];
    }
    pv[cv.scriptName].push({
      label: cv.menuName,
      click: () => scriptState.invokeMenu(cv.id),
    });
    return pv;
  }, {} as { [key: string]: Electron.MenuItemConstructorOptions[] });

  const makeSublabel = (script: ScriptResourceItem) => {
    const meta = script.meta;
    const sAuthor = i18n("MenuItem::Script::Author");
    const sVersion = i18n("MenuItem::Script::Version");
    const sURL = i18n("MenuItem::Script::URL");
    const sUnknown = i18n("MenuItem::Script::Unknown");
    return `${sAuthor}: ${meta.author ?? sUnknown}, ${sVersion}: ${
      meta.version ?? sUnknown
    },\n ${sURL}: ${script.setting.url ?? sUnknown}`;
  };

  return {
    label: i18n("MenuItem::Script"),
    id: "script" as AppMenuIds,
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
      ...(scriptState.needRefresh
        ? [
            {
              label: i18n("MenuItem::Script::NeedRefresh"),
              type: "normal",
              enabled: false,
            } as Electron.MenuItemConstructorOptions,
          ]
        : []),
      ...scriptState.scripts.map(
        (script): Electron.MenuItemConstructorOptions => {
          const ret = {
            label: script.meta.name,
            type: "checkbox",
            checked: script.setting.enabled,
            sublabel: makeSublabel(script),
            click: async () => {
              await scriptState.toggleConfig(script.meta.name);
              reloadAllMenu();
            },
          } as Electron.MenuItemConstructorOptions;

          if (script.setting.enabled && scriptMenu[script.meta.name]) {
            ret.type = "submenu";
            ret.submenu = [
              {
                label: i18n("MenuItem::Script::SubMenu::Switch"),
                type: "checkbox",
                checked: script.setting.enabled,
                click: async () => {
                  await scriptState.toggleConfig(script.meta.name);
                  reloadAllMenu();
                },
              },
              {
                type: "separator",
              },
              ...scriptMenu[script.meta.name],
            ];
          }

          return ret;
        }
      ),
    ],
  };
}
