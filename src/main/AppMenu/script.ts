import { MyPrompt } from "../MyPrompt";
import { reloadAllMenu } from "../reloadAllMenu";
import { openScriptFolder } from "../script";
import { ScriptResource } from "../script/resource";
import { MyAppMenuConstructorOption } from "./type";
import { dialog } from "electron";
import fs from "fs";
import path from "path";
import { exportScript, importScript, ExportedScriptData } from "../script/export";
import { packageFile } from "../utility";
import zlib from "zlib";

export function scriptMenu({
  refreshPage,
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
      {
        label: i18n("MenuItem::Script::ExportPackageEnabled"),
        type: "normal",
        click: async () => {
          const enabledScripts = scriptState.scripts.filter((s) => s.setting.enabled);
          const scriptData: ExportedScriptData[] = await Promise.all(
            enabledScripts.map((s) => exportScript(s))
          );
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, "0");
          const fileName = `script-package-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.ebcscriptpkg`;
          const { filePath } = await dialog.showSaveDialog({
            title: i18n("MenuItem::Script::ExportPackageEnabled"),
            defaultPath: fileName,
            filters: [{ name: "EBC Script Package", extensions: ["ebcscriptpkg"] }],
          });
          if (filePath) {
            const json = JSON.stringify(scriptData);
            const compressed = zlib.gzipSync(Buffer.from(json, "utf8"));
            fs.writeFileSync(filePath, compressed);
          }
        },
      },
      {
        label: i18n("MenuItem::Script::ImportPackage"),
        type: "normal",
        click: async () => {
          const { filePaths } = await dialog.showOpenDialog({
            title: i18n("MenuItem::Script::ImportPackage"),
            filters: [{ name: "EBC Script Package", extensions: ["ebcscriptpkg"] }],
            properties: ["openFile"],
          });
          if (filePaths && filePaths[0]) {
            try {
              const compressed = fs.readFileSync(filePaths[0]);
              const json = zlib.gunzipSync(compressed).toString("utf8");
              const importData: ExportedScriptData[] = JSON.parse(json);
              for (const s of importData) {
                await importScript(s);
              }
              const result = await dialog.showMessageBox({
                icon: packageFile("Logo.ico"),
                type: "info",
                message: i18n("MenuItem::Script::ImportSuccess"),
                buttons: [i18n("Alert::Confirm"), i18n("Alert::Cancel")],
              });
              if(result.response === 0) {
                refreshPage();
              }
            } catch (err: any) {
              await dialog.showMessageBox({
                icon: packageFile("Logo.ico"),
                type: "error",
                message: i18n("MenuItem::Script::ImportPackage") + "\n" + (err?.message || err),
                buttons: [i18n("Alert::Confirm")],
              });
            }
          }
        },
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
