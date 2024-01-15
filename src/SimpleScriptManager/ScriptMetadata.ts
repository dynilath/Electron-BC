
import * as path from 'path';
import * as fs from 'fs';
import { net } from 'electron';
import { ScriptMeta } from './Constants';

export function ReadScriptData(script: string): ScriptMeta | undefined {
    const match = /^\s*\/\/\s*==UserScript==\s*([\s\S\/@]+?)\/\/\s*==\/UserScript==/.exec(script);

    if (!match) {
        return undefined;
    }
    else {
        const scriptBlock = match[1];
        const regContent = /^\/\/\s+@(\S+)\s+(.+)/gm

        let result = regContent.exec(scriptBlock);

        let ret = {} as Partial<ScriptMeta['Meta']>;
        while (result) {
            switch (result[1]) {
                case 'author': ret.author = result[2]; break;
                case 'description': ret.description = result[2]; break;
                case 'match':
                case 'include': if (!ret.match) ret.match = []; ret.match.push(result[2]); break;
                case 'name': ret.name = result[2]; break;
                case 'namespace': ret.namespace = result[2]; break;
                case 'version': ret.version = result[2]; break;
            }

            result = regContent.exec(scriptBlock);
        }

        if (ret.name === undefined) return undefined;
        if (ret.match === undefined) return undefined;

        return {
            Meta: ret as Required<typeof ret>,
            Script: script,
        }
    }
}