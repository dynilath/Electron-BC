import { ipcMain } from "electron";
import { i18n } from "./i18n";

let handler_: Electron.WebContents | undefined = undefined;

function set_handler(handler: Electron.WebContents) {
    handler_ = handler;
    handler_?.send('alert-override');
    return handler_;
}

ipcMain.once('handler-register', (event) => set_handler(event.sender));

export function newHandler() {
    handler_ = undefined;
    return handler();
}

export function handler() {
    return new Promise<Electron.WebContents>((resolve) => {
        if (handler_) {
            resolve(handler_);
        } else {
            ipcMain.once('handler-register', (event) => resolve(set_handler(event.sender)));
        }
    });
}
