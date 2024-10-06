import { ipcRenderer } from "electron";
import Swal from "sweetalert2";
import { ScriptItem } from "./SimpleScriptManager/ScriptItem";

ipcRenderer.on('show-prompt-loadurl', (event: any, args: { title: string, confirm: string, cancel: string, please: string }) => {
    // from https://stackoverflow.com/questions/3809401 with '.js' added
    const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,32}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)\.js$/;

    Swal.fire({
        title: args.title,
        confirmButtonText: args.confirm,
        cancelButtonText: args.cancel,
        input: "text",
        inputPlaceholder: 'https://example.com/script.user.js',
        showCancelButton: true,
        inputValidator: (value) => {
            if (!value || !urlRegex.test(value))
                return args.please;
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const v = result.value as string;
            ipcRenderer.send('load-script-url', v);
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
declare var TranslationLanguage: string | undefined;

const emitLang = () => {
    if (TranslationLanguage)
        ipcRenderer.send('language-change', TranslationLanguage);
}

(async () => {
    emitLang();

    let _TranslationLoad = TranslationLoad;
    TranslationLoad = () => {
        _TranslationLoad();
        emitLang();
    };

    const dropDownId = 'LanguageDropdown-select';
    let ld = document.getElementById(dropDownId);
    while (!ld) {
        await new Promise(r => setTimeout(r, 100));
        ld = document.getElementById(dropDownId);
    }
    ld.addEventListener('change', (e) => { emitLang(); console.log('Language Change : ' + TranslationLanguage); });
})();
