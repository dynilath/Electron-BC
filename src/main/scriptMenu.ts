import { ScriptState } from "./script/state";

export function createScriptMenu(
  scriptState: ScriptState,
  reloadAllMenu: () => void,
  i18n: (tag: TextTag) => string
) {
  if (!Array.isArray(scriptState.scripts)) {
    console.log("ScriptState.scripts is not array");
    return [];
  }

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

  return [
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
  ];
}
