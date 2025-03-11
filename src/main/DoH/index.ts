
import { app, shell } from "electron";
import fs from "fs";
import path from "path";
import { parse, stringify } from "yaml";

const configMainPath = path.join(app.getPath('appData'), 'Bondage Club', 'Config');
if (!fs.existsSync(configMainPath)) {
    fs.mkdirSync(configMainPath, { recursive: true });
}

interface DoHConfig {
    mode: 'automatic' | 'secure' | 'off';
    servers: string[];
}

const defaultDoHConfig: DoHConfig = {
    mode: 'automatic',
    servers: ["https://cloudflare-dns.com/dns-query", "https://doh.opendns.com/dns-query", "https://dns.google/dns-query"]
};

function loadDoHConfig(): DoHConfig {
    const configPath = path.join(configMainPath, 'DoH.yml');
    if (!fs.existsSync(configPath)) {
        console.warn(`DoH config file not found at ${configPath}, creating default config.`);
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, stringify(defaultDoHConfig), 'utf8');
        return defaultDoHConfig;
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    try {
        const config = parse(fileContent) as DoHConfig;
        return config;
    } catch (error) {
        console.error(`Failed to parse DoH config file: ${error}`);
        return defaultDoHConfig;
    }
}

function activateDoH() {
    app.whenReady().then(() => {
        const config = loadDoHConfig();
        app.configureHostResolver({
            secureDnsMode: config.mode,
            secureDnsServers: config.servers
        });
    });
}

activateDoH();

function openConfigFile() {
    const configPath = path.join(configMainPath, 'DoH.yml');
    app.addRecentDocument(configPath);
    shell.openPath(configPath);
}

export class DoH {
    static refresh = activateDoH;
    static openConfigFile = openConfigFile;
}