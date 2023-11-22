import { dialog, ipcMain, Menu } from "electron";
import renderer from "./handler";
import { GetMainWindow } from "./MWContainer";
import { OpenScriptFolder, ScriptManager } from "./SimpleScriptManager";
import { i18n } from "./i18n";

async function GetMenu() {
    const scripts = await ScriptManager.LoadDataFolder();
    return Menu.buildFromTemplate(
        [{
            label: i18n('MenuItem::Tools'),
            submenu: [
                {
                    label: i18n('MenuItem::Tools::Open Dev Tools'),
                    type: 'normal',
                    click: () => {
                        const mw = GetMainWindow();
                        if (mw) {
                            mw.webContents.openDevTools();
                        }
                    }
                }]
        },
        {
            label: i18n('MenuItem::Script'),
            submenu: [
                {
                    label: i18n('MenuItem::Script::Load From URL'),
                    type: 'normal',
                    click: () => {
                        const r = renderer();
                        if (r) {
                            r.send('show-prompt-loadurl', {
                                title: i18n('Alert::LoadUrl::Input script URL'),
                                confirm: i18n('Alert::LoadUrl::Confirm'),
                                cancel: i18n('Alert::LoadUrl::Cancel'),
                                please: i18n('Alert::LoadUrl::Please input Correct'),
                            });
                        }
                    }
                },
                {
                    label: i18n('MenuItem::Script::Open Script Folder'),
                    type: 'normal',
                    click: () => {
                        OpenScriptFolder();
                    }
                },
                {
                    label: i18n('MenuItem::Script::Refresh Script'),
                    type: 'normal',
                    click: () => {
                        ipcMain.emit('reload-menu');
                    }
                },
                {
                    type: 'separator'
                },
                ...(Array.from(scripts.values()).map(_ => {
                    return {
                        label: _.name,
                        type: 'checkbox',
                        checked: _.enabled,
                        click: () => {
                            ScriptManager.SwitchItem(_.name);
                        }
                    } as { label: string, checked: boolean, type: 'checkbox', click: () => void };
                }))
            ]
        }])
}

export default GetMenu;