import { getDataFolder } from "./Constants";
import * as path from 'path';
import * as fs from 'fs';

export function getScriptMeta(script: string): ScriptMeta | undefined {
    const match = /^\s*\/\/\s*==UserScript==\s*([\s\S\/@]+?)\/\/\s*==\/UserScript==/.exec(script);

    if (match) {
        const scriptBlock = match[1];
        const regContent = /^\/\/\s+@(\S+)\s+(.+)/gm

        let result = regContent.exec(scriptBlock);

        let ret = {} as Partial<ScriptMeta>;
        while (result) {
            switch (result[1]) {
                case 'author': ret.author = result[2]; break;
                case 'name': ret.name = result[2]; break;
                case 'version': ret.version = result[2]; break;
            }

            result = regContent.exec(scriptBlock);
        }

        if (ret.name === undefined) return undefined;

        return ret as ScriptMeta;
    }
}

export class ScriptItem {
    constructor(readonly data: ScriptItemData) { }

    static saveScriptFile(url: string, content: string, promptPath?: string): ScriptItem | undefined {
        const meta = getScriptMeta(content);
        if (!meta) return undefined;
        const desiredPath = path.join(getDataFolder(), `${meta.name.replace(/[\\\/:*?"<>|]/g, '_')}.user.js`);

        if (promptPath && fs.existsSync(promptPath)) {
            fs.renameSync(promptPath, desiredPath);
        }

        const ret = new ScriptItem({
            loaded: false,
            meta,
            filePath: desiredPath,
            setting: {
                enabled: true,
                url,
                lastUpdate: Date.now()
            },
            content
        });

        fs.writeFileSync(desiredPath, content, { encoding: "utf-8" });

        return ret;
    }

    static loadScriptFile(scriptFileName: string, configs: Map<string, V2ConfigItem>): ScriptItem | undefined {
        const scriptFilePath = path.join(getDataFolder(), scriptFileName);
        if (!fs.existsSync(scriptFilePath)) return undefined;

        const content = fs.readFileSync(scriptFilePath, { encoding: "utf-8" });
        if (!content) return undefined;

        const meta = getScriptMeta(content);
        if (!meta) return undefined;

        const setting = configs.get(meta.name);

        if (!setting) return undefined;

        return new ScriptItem({
            loaded: false,
            meta,
            filePath: scriptFilePath,
            setting: {
                enabled: setting.setting.enabled,
                url: setting.setting.url,
                lastUpdate: setting.setting.lastUpdate
            },
            content
        });
    }
}