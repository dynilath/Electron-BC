import { LookupAddress } from "dns";
import { ipcMain, net } from "electron";
import settings from "electron-settings";

const DNSSettingTag = "dns";

interface DNSConfigItem {
    hostname: string;
    data: string[];
}

function isStringArray(value: any): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validHostname(hostname: unknown): hostname is string {
    return typeof hostname === "string" && hostname.startsWith("https://");
}

const dnsData: DNSConfigItem = {
    hostname: "",
    data: [],
}

export class DNSConfig {
    static getHosts(hostname:string): LookupAddress[] | undefined {
        if(dnsData.hostname === hostname){
            return dnsData.data.map(ip=>({
                address:ip,
                family: ip.includes("::") ? 4 : 6
            }))
        }
    }

    static init() {
        settings.get(DNSSettingTag).then((value) => {
            if (value && typeof value === "object"
                && !Array.isArray(value) && isStringArray(value["data"]) && typeof value["enabled"] === "boolean") {
                dnsData.data = value["data"];
            }
        });
    }

    static async save() {
        await settings.set(DNSSettingTag, {
            hostname: dnsData.hostname,
            data: dnsData.data,
        });
    }

    static async updateFrom1111(webContents: Electron.WebContents) {
        const server = await (new Promise((resolve)=>{
            ipcMain.once("get-server-reply",(event, server)=>resolve(server));
            webContents.send("get-server");
        }));

        if(!validHostname(server)){
            console.warn("Invalid server address", server);
            return;
        }

        const server_url = new URL(server);

        console.log("start fetch DNS data for", server_url.hostname);

        const response = await net.fetch(`https://1.1.1.1/dns-query?name=${server_url.hostname}`, {
            headers: {
                "accept": "application/dns-json",
            },
            bypassCustomProtocolHandlers: true
        });

        if(!response.ok){
            console.warn("Failed to fetch DNS data", response);
            return;
        }

        const data = await response.json();
        
        if(!Array.isArray(data.Answer) || data.Answer.length === 0){
            console.warn("Invalid DNS data", data);
            return;
        }

        const ips = data.Answer.map((item: any) => item.data) as string[];
        dnsData.data = ips;
        dnsData.hostname = server_url.hostname;
        await this.save();
        return ips;
    }
}