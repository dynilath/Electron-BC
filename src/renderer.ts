import { ipcRenderer } from "electron";
import Swal from "sweetalert2";
import { ScriptItem } from "./SimpleScriptManager/ScriptItem";

ipcRenderer.on('show-prompt-loadurl', (event: any, args: { title: string, confirm: string, cancel: string, please: string }) => {
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
});

ipcRenderer.on('load-script', async (event: any, script: ScriptItem) => {
    console.log('Load-Script : ' + JSON.stringify({ name: script.data.meta.name, author: script.data.meta.author, version: script.data.meta.version }));
    const s = document.createElement('script');
    s.textContent = script.data.content;
    document.head.appendChild(s);
    ipcRenderer.send('load-script-done', script.data.meta.name);
    s.remove();
})

ipcRenderer.on('reload', () => location.reload());
ipcRenderer.on('alert-override', (event, args) => {
    window.alert = (message?: string) => {
        Swal.fire({
            title: args.title,
            text: message,
            confirmButtonText: args.confirm,
        });
    };
})

ipcRenderer.send('handler-register');

declare var TranslationLoad: () => void;
declare var TranslationNextLanguage: () => void;
declare var TranslationLanguage: string | undefined;

const emitLang = () => {
    if (TranslationLanguage)
        ipcRenderer.send('language-change', TranslationLanguage);
}

(() => {
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
})();
