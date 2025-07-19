import { BrowserWindow } from "electron";
import path from "path";
import { fallback, fetchLatestBC } from "./fetchLatestBC";
import { packageFile } from "../main/utility";
import { BCURLPreference } from "../urlprefer";
import { sleep } from "../render/utils";
import { ForwardedEvent } from "./constant";

function webContentsSend(
  win: BrowserWindow,
  channel: typeof ForwardedEvent[number],
  ...args: any[]
) {
  if (win.webContents.isDestroyed()) return;
  win.webContents.send(channel, ...args);
}

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
    icon: packageFile("Logo.ico"),
  });

  try {
    win.loadFile("resource/loading.html");
    webContentsSend(win, "fetching-bc-start");

    const results = await fetchLatestBC();
    const result = BCURLPreference.choose(results);

    webContentsSend(win, "fetching-bc-done", result);
    win.close();
    return results;
  } catch (error) {
    webContentsSend(win, "error", error);
  }

  const fb_results = await fallback();
  const result = BCURLPreference.choose(fb_results);
  webContentsSend(win, "fetching-bc-fb", result);
  await sleep(2000);
  win.close();
  return fb_results;
}
