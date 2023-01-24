import { GetDataPath, ScriptMeta } from "./Constants";
import * as path from 'path';
import * as fs from 'fs';
import { ReadScriptData } from "./ScriptMetadata";

export class ScriptItem {
    name: string;
    enabled: boolean;
    loaded: boolean;
    content: ScriptMeta;

    constructor(options: { name: string, content: ScriptMeta }) {
        this.name = options.name;
        this.content = options.content;
        this.enabled = true;
        this.loaded = false;
    }

    static LoadScriptWithScriptContent(scriptFilePath: string, content: string): ScriptItem | undefined {
        console.log('LoadScriptWithScriptContent : ' + scriptFilePath);

        if (!fs.existsSync(scriptFilePath)) {
            fs.writeFileSync(scriptFilePath, content);
        }

        const scriptMeta = ReadScriptData(content);
        if (scriptMeta === undefined) return undefined;

        return new ScriptItem({ name: scriptMeta.Meta.name, content: scriptMeta });
    }

    static LoadScriptFromFile(scriptFileName: string): ScriptItem | undefined {
        const scriptFilePath = path.join(GetDataPath(), scriptFileName);
        if (!fs.existsSync(scriptFilePath)) return undefined;
        return this.LoadScriptWithScriptContent(scriptFilePath, fs.readFileSync(scriptFilePath).toString());
    }
}