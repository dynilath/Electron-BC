import { BrowserWindow, ipcMain } from "electron";
import { showPrompt, PromptOptions } from "../prompt";
import { i18nText } from "../i18n";

interface PromptExecutor {
  confirm: () => void;
  cancel?: () => void;
}

export interface PromptParent {
  window: BrowserWindow;
  i18n: (tag: TextTag) => string;
}

const promptList = new Map<string, PromptExecutor>();

async function sendConfirmCancelPrompt(
  parent: PromptParent,
  message: string,
  confirm: () => void,
  cancel?: () => void
) {
  const result = await showPrompt({
    parent: parent.window,
    type: "confirmCancel",
    message,
    confirmText: parent.i18n("Alert::Confirm"),
    cancelText: parent.i18n("Alert::Cancel"),
  });

  if (result) {
    if (result.ok) {
      confirm();
    } else if (cancel) {
      cancel();
    }
  }
}

async function infoPrompt(parent: PromptParent, message: string) {
  await showPrompt({
    parent: parent.window,
    type: "info",
    title: message,
    message: "",
    confirmText: parent.i18n("Alert::Confirm"),
  });
}

async function showPromptLoadurl(parent: PromptParent, suggestion?: string) {
  const result = await showPrompt({
    parent: parent.window,
    type: "input",
    inputPlaceholder: "https://example.com/script.user.js",
    inputType: "userscript",
    inputError: parent.i18n("Alert::LoadUrl::PleaseInputCorrectUrl"),
    title: parent.i18n("Alert::LoadUrl::InputScriptURL"),
    defaultValue: suggestion,
    confirmText: parent.i18n("Alert::Confirm"),
    cancelText: parent.i18n("Alert::Cancel"),
  });

  if (result && result.ok) {
    parent.window.webContents.emit("load-script-url", result.value);
  }
}

ipcMain.on("web-alert", (event, data) => {
  const i18nObj = new i18nText();
  i18nObj.language = data.language || "EN";
  // infoPrompt
});

export const MyPrompt = {
  confirmCancel: sendConfirmCancelPrompt,
  info: infoPrompt,
  loadUrl: showPromptLoadurl,
  error: infoPrompt,
};
