import { contextBridge, ipcRenderer } from "electron";
import { contextIsolated } from "process";

interface Window {
    CommonGetServer?: () => string;
    exports?: any;
    Dexie?: any;
}

function addScript(src: string, type?: string) {
    let onload: (() => void) | undefined;

    const script = document.createElement('script');
    script.src = src;
    if (type) script.type = type;
    script.onload = () => onload?.();
    document.head.appendChild(script);

    return { onload: (cb: () => void) => { onload = cb; } };
}

window.addEventListener('DOMContentLoaded', () => {
    if (window.exports === undefined) window.exports = {};

    addScript("../../build/renderer/index.js", "module").onload(() => {
        (window as any).Dexie = require('dexie');
    });

    (window as Window).CommonGetServer = () => {
        console.log('CommonGetServer');
        return "https://bondage-club-server.herokuapp.com/";
    }
});

contextBridge.exposeInMainWorld('EBCContext', {
    querySuggestion: async (source: string) => {
        ipcRenderer.send('keytar-query-suggestion', source);
    },
    languageChange: async (lang: string) => {
        ipcRenderer.send('language-change', lang);
    },
});