import { ipcMain } from "electron";

let handler: Electron.WebContents | undefined = undefined;

ipcMain.on('handler-register', (event) => {
    handler = event.sender;
});

export function getHandler() {
    return handler;
}
