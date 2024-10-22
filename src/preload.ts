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

    addScript("../../build/renderer.js", "module").onload(() => {
        window.Dexie = require('dexie');
    });

    (window as Window).CommonGetServer = () => {
        console.log('CommonGetServer');
        return "https://bondage-club-server.herokuapp.com/";
    }
});