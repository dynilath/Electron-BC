import * as fs from 'fs';
import { SettingTag, getDataFolder } from './Constants';
import { ScriptItem } from './ScriptItem';
import { net } from 'electron';
import settings from 'electron-settings';
import { handler } from '../handler';
import { isV1Config, isV2Config } from './types';

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export class ScriptManager {
    static scripts: Map<string, ScriptItem>;

    private static loadSettings(): V2ConfigItem[] {
        const config = settings.getSync(SettingTag) as ConfigItem[] | null;
        if (!config) return [];

        const upgradeConfig = config.map(c => {
            if (isV1Config(c)) {
                return {
                    name: c.name,
                    setting: {
                        enabled: c.enabled,
                        url: null,
                        lastUpdate: Date.now()
                    }
                } as V2ConfigItem;
            }
            if (isV2Config(c)) return c;
        }).filter(c => c !== undefined) as V2ConfigItem[];

        return upgradeConfig;
    }

    private static saveSettings() {
        const configs = Array.from(ScriptManager.scripts.entries(), ([name, item]): any => {
            return {
                name: name,
                setting: {
                    enabled: item.data.setting.enabled,
                    url: item.data.setting.url,
                    lastUpdate: item.data.setting.lastUpdate,
                }
            } as V2ConfigItem;
        });

        settings.setSync(SettingTag, configs);
    }

    static onScriptLoaded(scriptName: string) {
        const script = this.scripts.get(scriptName);
        if (script) script.data.loaded = true;
        console.log('Script[Load Done] : ' + JSON.stringify({ name: scriptName }));
    }

    public static async loadDataFolder() {
        const rawConfigs = new Map<string, V2ConfigItem>(this.loadSettings().map(_ => [_.name, _]));

        const newItemList = fs.readdirSync(getDataFolder(), { withFileTypes: true })
            .filter(i => i.isFile() && i.name.endsWith('.user.js'))
            .map(i => ScriptItem.loadScriptFile(i.name, rawConfigs))
            .filter(i => i !== undefined) as ScriptItem[];

        this.scripts = new Map(newItemList.map(_ => [_.data.meta.name, _]));

        this.saveSettings();

        return this.scripts;
    }

    public static loadSingleScript(script: ScriptItem) {
        handler().then(h => {
            h.send('load-script', script);
            console.log('Script[Load] : ' + JSON.stringify({ name: script.data.meta.name }));
        })
    }

    public static async loadScript(reload?: boolean) {
        Array.from(ScriptManager.scripts.values()).filter(i => i.data.setting.enabled && (reload || !i.data.loaded)).forEach(i => {
            i.data.loaded = false;
            this.loadSingleScript(i);
        });
    }

    public static switchItem(name: string) {
        const target = this.scripts.get(name);
        if (target) {
            const old = target.data.setting.enabled;
            target.data.setting.enabled = !old;
            this.saveSettings();
            console.log('Script[Switch] : ' + JSON.stringify({ name: target.data.meta.name, enabled: target.data.setting.enabled }));
            if (!old && !target.data.loaded) this.loadSingleScript(target);
        }
    }

    public static updateAll() {
        const counter = new Set<string>(this.scripts.keys());
        let accepted_: (() => void) | undefined = undefined;

        const singleFinish = () => {
            if (counter.size === 0) {
                this.saveSettings();
                accepted_?.();
            }
        }

        Array.from(this.scripts.values()).forEach(i => {
            if (i.data.setting.url === null) counter.delete(i.data.meta.name);
            if (i.data.setting.url) this.loadOneFromURL(i.data.setting.url, i.data.filePath).then(() => {
                counter.delete(i.data.meta.name);
                singleFinish();
            }, (e) => {
                console.error(e);
                counter.delete(i.data.meta.name);
                singleFinish();
            });
        });

        return { then: (accepted: () => void) => { accepted_ = accepted; } };
    }

    public static loadOneFromURL(url: string, promptPath?: string) {
        console.log('Script[Load URL] : ' + url + ' To : ' + promptPath);
        let accepted_: (() => void) | undefined = undefined;
        let rejected_: ((reason?: Error) => void) | undefined = undefined;

        const req = net.request(url);
        req.on('response', (r) => {
            r.on('data', (d) => {
                const content = d.toString('utf-8');
                const script = ScriptItem.saveScriptFile(url, content, promptPath);
                if (script) {
                    this.scripts.set(script.data.meta.name, script);
                    this.saveSettings();
                    accepted_?.();
                }
            })
        });
        req.on('error', (e) => {
            rejected_?.(e);
        });
        req.end();

        return {
            then(accepted: () => void, rejected?: (reason?: Error) => void) {
                accepted_ = accepted;
                rejected_ = rejected;
            }
        };
    }
}