import { contextBridge, ipcRenderer } from "electron";
import { ForwardedEvent } from "./constant";
import { i18nText } from "../i18n";

const i18ntext = new i18nText();

ForwardedEvent.forEach((eventName) => {
  ipcRenderer.on(eventName, (event, ...args) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail: args }));
  });
});

contextBridge.exposeInMainWorld("electron", {
  i18n: (key: TextTag) => i18ntext.get(key),
});
