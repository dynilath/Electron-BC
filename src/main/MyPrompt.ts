import { ipcMain } from "electron";
import { randomString } from "../utility";

interface PromptExecutor {
  confirm: () => void;
  cancel?: () => void;
}

const promptList = new Map<string, PromptExecutor>();

function initConfirmCancelPrompt() {
  ipcMain.on(
    "confirm-cancel-prompt-reply",
    (event, key: string, confirm: boolean) => {
      const executor = promptList.get(key);
      if (executor) {
        if (confirm) executor.confirm();
        else if (executor.cancel) executor.cancel();
        promptList.delete(key);
      }
    }
  );
}

function sendConfirmCancelPrompt(
  webContents: Electron.WebContents,
  message: TextTag,
  confirm: () => void,
  cancel?: () => void
) {
  const key = randomString();
  promptList.set(key, { confirm, cancel });
  webContents.send("confirm-cancel-prompt", message, key);
}

function infoPrompt(webContents: Electron.WebContents, message: string) {
  webContents.send("info-prompt", message);
}

function showPromptLoadurl(
  webContents: Electron.WebContents,
  suggestion?: string
) {
  webContents.send("show-prompt-loadurl", suggestion);
}

export class MyPrompt {
  static init = initConfirmCancelPrompt;
  static confirmCancel = sendConfirmCancelPrompt;
  static info = infoPrompt;
  static loadUrl = showPromptLoadurl;

  static error = infoPrompt;
}
