import { BrowserWindow, shell } from 'electron';
import * as path from "path";
import { packageFile } from "./utility";

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
    icon: packageFile("Logo.ico"),
  });

  changelogWindow.setMenu(null);

  changelogWindow.loadFile("build/changelog.html");
  changelogWindow.setTitle("Electron-BC Change Log");

  changelogWindow.on("closed", () => {
    changelogWindow = undefined;
  });
  changelogWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  changelogWindow.webContents.on("will-navigate", (event, url) => {
    if (changelogWindow && url !== changelogWindow.webContents.getURL()) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}