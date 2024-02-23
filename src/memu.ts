import { dialog, ipcMain, Menu } from "electron";
import { getHandler } from "./handler";
import { GetMainWindow } from "./MWContainer";
import { openScriptFolder, ScriptManager } from "./SimpleScriptManager";
import { i18n } from "./i18n";

type MenuIds = 'script' | 'tools';

export function makeMenu() {
    return Menu.buildFromTemplate(
        [{
            label: i18n('MenuItem::Tools'),
            id: 'tools' as MenuIds,
            submenu: [
                {
                    label: i18n('MenuItem::Tools::Refresh'),
                    type: 'normal',
                    click: () => {
                        const handler = getHandler();
                        if (handler) {
                            handler.send('reload');
                            ScriptManager.loadDataFolder().then(() => reloadMenu());
                        }
                    }
                },
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
            id: 'script' as MenuIds,
            submenu: [
                {
                    label: i18n('MenuItem::Script::Load From URL'),
                    type: 'normal',
                    click: () => {
                        const r = getHandler();
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
                    click: () => openScriptFolder()
                },
                {
                    label: i18n('MenuItem::Script::UpdateScript'),
                    type: 'normal',
                    click: () => ScriptManager.updateAll().then(() => reloadMenu())
                },
                {
                    type: 'separator'
                },
                ...(Array.from(ScriptManager.scripts.values()).map(s => {
                    return {
                        label: s.data.meta.name,
                        type: 'checkbox' as 'checkbox',
                        checked: s.data.setting.enabled,
                        sublabel: (() => {
                            const meta = s.data.meta;
                            const sAuthor = i18n('MenuItem::Script::Author');
                            const sVersion = i18n('MenuItem::Script::Version');
                            const sURL = i18n('MenuItem::Script::URL');
                            const sUnknown = i18n('MenuItem::Script::Unknown');
                            return `${sAuthor}: ${meta.author ?? sUnknown}, ${sVersion}: ${meta.version ?? sUnknown}, ${sURL}: ${s.data.setting.url ?? sUnknown}`;
                        })(),
                        click: () => ScriptManager.switchItem(s.data.meta.name)
                    }
                }))
            ]
        }])
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
    const yPosition = windowBounds.y;

    targetMenu.menu.popup({
        window,
        x: menu.items.indexOf(targetMenu) * 25,
        y: 1
    });
}