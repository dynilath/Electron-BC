import { ipcMain } from "electron";
import { handler } from "../handler";
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
  message: TextTag,
  confirm: () => void,
  cancel?: () => void
) {
  const key = randomString();
  promptList.set(key, { confirm, cancel });
  handler().then((h) => h.send("confirm-cancel-prompt", message, key));
}

function infoPrompt(message: string) {
  handler().then((h) => h.send("info-prompt", message));
}

function showPromptLoadurl(suggestion?: string) {
  handler().then((h) =>
    h.send("show-prompt-loadurl", ...(suggestion ? [suggestion] : []))
  );
}

export class MyPrompt {
  static init = initConfirmCancelPrompt;
  static sendConfirmCancel = sendConfirmCancelPrompt;
  static info = infoPrompt;
  static loadUrl = showPromptLoadurl;
}
