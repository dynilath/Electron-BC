import { ipcMain } from "electron";

let handler_: Electron.WebContents | undefined = undefined;

function set_handler(handler: Electron.WebContents) {
  handler_ = handler;
  return handler_;
}

ipcMain.once("handler-register", (event) => set_handler(event.sender));

export function newHandler() {
  handler_ = undefined;
  return handler();
}

export function handler() {
  return new Promise<Electron.WebContents>((resolve) => {
    if (handler_) {
      resolve(handler_);
    } else {
      ipcMain.once("handler-register", (event) =>
        resolve(set_handler(event.sender))
      );
    }
  });
}
