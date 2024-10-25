import { BrowserWindow, shell } from 'electron';
import * as path from "path";

let changelogWindow: BrowserWindow | undefined;

export function openChangelog() {
    if (changelogWindow) {
        changelogWindow.focus();
        return;
    }

    changelogWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
        icon: path.join(__dirname, "../BondageClub/BondageClub/Icons/Logo.png")
    });

    changelogWindow.setMenu(null);

    changelogWindow.loadFile('dist/changelog.html');
    changelogWindow.setTitle('Electron-BC Change Log');

    changelogWindow.on('closed', () => {
        changelogWindow = undefined;
    });
    changelogWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
    changelogWindow.webContents.on('will-navigate', (event, url) => {
        if (changelogWindow && url !== changelogWindow.webContents.getURL()) {
            event.preventDefault();
            shell.openExternal(url);
        }
    });
}