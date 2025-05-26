import { BrowserWindow } from "electron";


export type PromptType = "input" | "confirmCancel" | "info";

export type PromptInputType = "userscript" | "ebcspackage" | "url";

export interface PromptOptions {
  type: PromptType;
  inputPlaceholder?: string;
  inputType?: PromptInputType;
  inputError?: string;
  title?: string;
  content?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
}

export interface PromptResult {
  ok: boolean;
  value?: string;
}
export interface PromptParent {
  window: BrowserWindow;
  i18n: (tag: TextTag) => string;
}

