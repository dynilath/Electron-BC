import { contextBridge } from "electron";
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
  addScript("ebc://render.js", "module");
});

contextBridge.exposeInMainWorld("EBCContext", createCtxBridge());
