import { dialog, ipcMain, Menu } from "electron";
import renderer from "./handler";
import { GetMainWindow } from "./MWContainer";
import { OpenScriptFolder, ScriptManager } from "./SimpleScriptManager";

async function GetMenu() {
    const scripts = await ScriptManager.LoadDataFolder();
    return Menu.buildFromTemplate(
        [{
            label: 'Tools',
            submenu: [
                {
                    label: 'Open Dev Tools',
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
            label: 'Script',
            submenu: [
                {
                    label: 'Load From URL',
                    type: 'normal',
                    click: () => {
                        const r = renderer();
                        if (r) {
                            r.send('show-prompt-loadurl');
                        }
                    }
                },
                {
                    label: 'Open Script Folder',
                    type: 'normal',
                    click: () => {
                        OpenScriptFolder();
                    }
                },
                {
                    label: 'Refresh Script',
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