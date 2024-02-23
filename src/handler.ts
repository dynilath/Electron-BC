import { ipcMain } from "electron";

let handler_: Electron.WebContents | undefined = undefined;

ipcMain.once('handler-register', (event) => {
    handler_ = event.sender;
});

export function newHandler() {
    handler_ = undefined;
    return handler();
}

export function handler() {
    return new Promise<Electron.WebContents>((resolve) => {
        if (handler_) {
            resolve(handler_);
        } else {
            ipcMain.once('handler-register', (event) => {
                handler_ = event.sender;
                resolve(handler_);
            });
        }
    });
}
