import { BrowserWindow } from "electron";
import path from "path";
import { fetchLatestBC } from "./fetchLatestBC";

export async function createFetchBCVersionWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 300,
    resizable: false,
    frame: false,
    titleBarStyle: "hidden",
    backgroundColor: "#2f3542",
    fullscreenable: false,
    skipTaskbar: false,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, "loading_preload.js"),
    },
  });

  try {
    win.loadFile("resource/loading.html");
    win.webContents.send("fetching-bc-start");

    const result = await fetchLatestBC();
    win.webContents.send("fetching-bc-done", result);
    win.close();
    return result;
  } catch (error) {
    win.webContents.send("error", error);
  }
}
