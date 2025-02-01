import { contextBridge, ipcRenderer } from "electron";
import { createCtxBridge } from "./bridge";

function addScript(src: string, type?: string) {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = src;
    if (type) script.type = type;
    script.onload = resolve;
    document.head.appendChild(script);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  if (location.protocol !== "file:") addScript("ebc://render.js", "module");
  else {
    ipcRenderer.on("electron-bc-loading", (event, data) => {
      window.dispatchEvent(
        new CustomEvent("electron-bc-loading", { detail: data })
      );
    });
  }
});

contextBridge.exposeInMainWorld("EBCContext", createCtxBridge());
