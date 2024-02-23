window.addEventListener("DOMContentLoaded", () => {
    const replaceText = (selector: string, text: string) => {
        const element = document.getElementById(selector);
        if (element) {
            element.innerText = text;
        }
    };

    for (const type of ["chrome", "node", "electron"]) {
        replaceText(`${type}-version`, process.versions[type as keyof NodeJS.ProcessVersions] as string);
    }
});

interface Window {
    CommonGetServer?: () => string;
    exports?: any;
}

window.addEventListener('DOMContentLoaded', () => {
    if (window.exports === undefined) window.exports = {};

    const script = document.createElement('script');
    script.src = "../../build/renderer.js";
    script.type = "module";
    document.head.appendChild(script);

    window.CommonGetServer = () => {
        console.log('CommonGetServer');
        return "https://bondage-club-server.herokuapp.com/";
    }
});


