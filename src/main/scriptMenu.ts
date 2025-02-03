import { i18n } from "../i18n";
import { ScriptConfig } from "./script/config";
import { ScriptResource } from "./script/resource";
import { ScriptState } from "./script/state";

export function createScriptMenu(
  scriptState: ScriptState,
  reloadAllMenu: () => void
) {
  if (!Array.isArray(scriptState.scripts)) {
    console.log("ScriptState.scripts is not array");
    return [];
  }

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
      (script): Electron.MenuItemConstructorOptions => ({
        label: script.meta.name,
        type: "checkbox",
        checked: script.setting.enabled,
        sublabel: (() => {
          const meta = script.meta;
          const sAuthor = i18n("MenuItem::Script::Author");
          const sVersion = i18n("MenuItem::Script::Version");
          const sURL = i18n("MenuItem::Script::URL");
          const sUnknown = i18n("MenuItem::Script::Unknown");
          return `${sAuthor}: ${meta.author ?? sUnknown}, ${sVersion}: ${
            meta.version ?? sUnknown
          },\n ${sURL}: ${script.setting.url ?? sUnknown}`;
        })(),
        click: async () => {
          await scriptState.toggleConfig(script.meta.name);
          reloadAllMenu();
        },
      })
    ),
  ];
}
