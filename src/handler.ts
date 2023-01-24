import { ipcMain } from "electron";

let renderer: Electron.WebContents | undefined = undefined;

ipcMain.on('handler-register', (event) => {
    renderer = event.sender;
});

function GetRendererHandler() {
    return renderer;
}

export default GetRendererHandler;