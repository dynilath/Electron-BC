import { contextBridge, ipcRenderer } from "electron";
import { ForwardedEvent } from "./constant";
import { i18n } from "../i18n";

ForwardedEvent.forEach((eventName) => {
  ipcRenderer.on(eventName, (event, ...args) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail: args }));
  });
});

contextBridge.exposeInMainWorld("electron", {
  i18n: (key: TextTag) => i18n(key),
});
