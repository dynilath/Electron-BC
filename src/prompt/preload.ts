import { contextBridge, ipcRenderer } from 'electron';
import { PromptOptions, PromptResult } from "./types";

contextBridge.exposeInMainWorld("PromptAPI", {
  onPrompt: (cb: (data: any) => void) => {
    ipcRenderer.on("prompt-data", (_e, data) => cb(data));
  },
  sendResult: (result: any) => {
    ipcRenderer.send("prompt-result", result);
  },
  log: (data: string) => {
    ipcRenderer.send("log", data);
  },
  resizeWindow: (width: number, height: number) => {
    ipcRenderer.send("prompt-resize", { width, height });
  },
});

declare global {
  interface Window {
    PromptAPI: {
      onPrompt: (cb: (data: PromptOptions) => void) => void;
      sendResult: (result: PromptResult) => void;
      log: (data: string) => void;
      resizeWindow: (width: number, height: number) => void;
    };
  }
}
