import { app, powerSaveBlocker } from 'electron';
import { autoUpdater } from 'electron-updater';
import { Credential } from './main/credential';
import { MyProtocol } from './main/protocol';
import { ScriptResource } from './main/script/resource';
import { createFetchBCVersionWindow } from './loading';
import { MainWindowProvider } from './main/mainWindow';
import settings from 'electron-settings';
import { AssetCache } from './main/AssetCache';

let mainWindowProvider: MainWindowProvider | undefined;

console.log('Setting file:', settings.file());

app.whenReady().then(async () => {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  autoUpdater.checkForUpdatesAndNotify();

  ScriptResource.init();
  MyProtocol.init();
  Credential.init();
  AssetCache.init();

  const results = await createFetchBCVersionWindow();
  if (!results) return;

  MyProtocol.setBCStatus(results);

  mainWindowProvider = new MainWindowProvider();

  mainWindowProvider.createWindow();

  powerSaveBlocker.start('prevent-display-sleep');

  if (app.isPackaged) {
    setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 60000);
  }
});

app.on('second-instance', () => {
  mainWindowProvider?.createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
