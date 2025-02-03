import { ipcMain } from "electron";

export function reloadAllMenu() {
  ipcMain.emit("reload-menu");
}
