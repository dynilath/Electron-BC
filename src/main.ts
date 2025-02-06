import { app, powerSaveBlocker } from "electron";
import { autoUpdater } from "electron-updater";
import { Credential } from "./main/credential";
import { MyProtocol } from "./main/protocol";
import { MyPrompt } from "./main/MyPrompt";
import { ScriptResource } from "./main/script/resource";
import { createFetchBCVersionWindow } from "./loading";
import { MainWindowProvider } from "./main/mainWindow";
import settings from "electron-settings";

const DeltaUpdater = require("@electron-delta/updater");

let mainWindowProvider: MainWindowProvider | undefined;

console.log("Setting file:", settings.file());

app.whenReady().then(async () => {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  const deltaUpdater = new DeltaUpdater({
    autoUpdater,
  });

  try {
    await deltaUpdater.boot({ splashScreen: true });
  } catch (error) {
    console.error(error);
  }

  ScriptResource.init();
  MyProtocol.init();
  Credential.init();
  MyPrompt.init();

  const result = await createFetchBCVersionWindow();
  if (!result) return;

  MyProtocol.setBCStatus(result);

  mainWindowProvider = new MainWindowProvider(result);

  mainWindowProvider.createWindow();

  powerSaveBlocker.start("prevent-display-sleep");

  if (app.isPackaged) {
    setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 60000);
  }
});

app.on("second-instance", () => {
  mainWindowProvider?.createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});