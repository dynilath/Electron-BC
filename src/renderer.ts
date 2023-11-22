// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process unless
// nodeIntegration is set to true in webPreferences.
// Use preload.js to selectively enable features
// needed in the renderer process.

import { ipcRenderer } from "electron";
import Swal from "sweetalert2";
import { ScriptItem } from "./SimpleScriptManager/ScriptItem";

declare var CommonGetServer: () => string;

CommonGetServer = () => "https://bondage-club-server.herokuapp.com/";


function ShowLoadURLPrompt(event: any, args: { title: string, confirm: string, cancel: string, please: string }) {
    Swal.fire({
        title: args.title,
        confirmButtonText: args.confirm,
        cancelButtonText: args.cancel,
        input: 'url',
        inputPlaceholder: 'https://example.com/script.user.js',
        showCancelButton: true,
    }).then((result) => {
        if (result.isConfirmed) {
            const v = result.value as string;
            if (v.length > 0 && v.endsWith('.user.js'))
                ipcRenderer.send('load-script-url', v);
            else
                Swal.fire({
                    title: args.please,
                    confirmButtonText: args.confirm,
                });
        }
    });
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function LoadScript(event: any, script: ScriptItem) {
    console.log('on load-script : ' + JSON.stringify({ name: script.name, enabled: script.enabled, loaded: script.loaded }));
    while ((window as any).Player === undefined) await delay(100);
    eval(script.content.Script)
}

ipcRenderer.on('show-prompt-loadurl', ShowLoadURLPrompt)
ipcRenderer.on('load-script', LoadScript)

ipcRenderer.send('handler-register');

declare var TranslationLoad: () => void;
declare var TranslationNextLanguage: () => void;
declare var TranslationLanguage: string | undefined;

const emitLang = () => {
    if (TranslationLanguage)
        ipcRenderer.send('language-change', TranslationLanguage);
}

ipcRenderer.on('script-document-ready', () => {
    emitLang();

    let _TranslationLoad = TranslationLoad;
    TranslationLoad = () => {
        _TranslationLoad();
        emitLang();
    };

    let _TranslationNextLanguage = TranslationNextLanguage;
    TranslationNextLanguage = () => {
        _TranslationNextLanguage();
        emitLang();
    };
})

