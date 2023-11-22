import * as path from 'path';
import * as fs from 'fs';
import { GetDataPath } from './Constants';
import { ScriptItem } from './ScriptItem';
import { ipcMain, net } from 'electron';

import settings from 'electron-settings';
import renderer from '../handler';

type ConfigItem = { name: string, enabled: boolean };

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class ScriptManager {
    static _storage: ScriptItem[] = [];

    static _scripts = new Map<string, ScriptItem>();

    public static async LoadScript(reload?: boolean) {
        while (renderer() === undefined) await delay(100);
        Array.from(ScriptManager._scripts.values()).filter(_ => _.enabled && (reload || !_.loaded)).forEach(_ => {
            renderer()?.send('load-script', _);
            console.log('emit load-script : ' + JSON.stringify({ name: _.name, enabled: _.enabled, loaded: _.loaded }));
            _.loaded = true;
        });
    }

    public static AddScript(script: ScriptItem) {
        const old = this._scripts.get(script.name);
        if (old !== undefined) {
            script.enabled = old.enabled;
            script.loaded = false;
            this._scripts.set(script.name, script);
        }
    }

    public static async LoadDataFolder() {
        console.log('LoadDataFolder');

        const newItemList = fs.readdirSync(GetDataPath(), { withFileTypes: true })
            .filter(_ => _.isFile() && _.name.endsWith('.user.js'))
            .map(_ => ScriptItem.LoadScriptFromFile(_.name))
            .filter(_ => _ !== undefined) as ScriptItem[];

        const configs = new Map(this.LoadConfigs().map(_ => [_.name, _]));

        newItemList.forEach(_ => {
            const old = this._scripts.get(_.name);
            if (old !== undefined) {
                // maybe updated, do not use old content;
                _.enabled = old.enabled;
                _.loaded = old.loaded;
            } else {
                const old_config = configs.get(_.name)
                if (old_config !== undefined) {
                    _.enabled = old_config.enabled;
                    _.loaded = false;
                }
            }
        });

        this._scripts = new Map(newItemList.map(_ => [_.name, _]));

        this.SaveConfigs();

        return this._scripts;
    }

    static SaveConfigs() {
        settings.setSync('ScriptManagerConfig', Array.from(this._scripts.values())
            .map(_ => { return { name: _.name, enabled: _.enabled } }));
    }

    static LoadConfigs(): ConfigItem[] {
        const config = settings.getSync('ScriptManagerConfig');
        return (config || []) as ConfigItem[];
    }

    static SwitchItem(name: string) {
        const target = this._scripts.get(name);
        if (target) {
            const old = target.enabled;
            target.enabled = !target.enabled;
            this.SaveConfigs();
            if (!old) this.LoadScript();
        }
    }

    public static LoadFromURl(url: string, then: () => void) {
        console.log('LoadFromURL : ' + url)
        const req = net.request(url);
        req.on('response', (r) => {
            r.on('data', (d) => {
                const desiredPath = path.join(GetDataPath(), `${Date.now()}.user.js`);
                const lo = ScriptItem.LoadScriptWithScriptContent(desiredPath, d.toString('utf-8'));
                if (lo) {
                    this.AddScript(lo);
                    then();
                }
            })
        });
        req.end();
    }
}

