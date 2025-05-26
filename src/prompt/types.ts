import { BrowserWindow } from "electron";


export interface PromptOptions {
  type: PromptType;
  inputPlaceholder?: string;
  inputType?: "userscript" | "url";
  inputError?: string;
  title?: string;
  content?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
}

export type PromptType = "input" | "confirmCancel" | "info";

export interface PromptResult {
  ok: boolean;
  value?: string;
}
export interface PromptParent {
  window: BrowserWindow;
  i18n: (tag: TextTag) => string;
}

