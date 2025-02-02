interface ScriptSetting {
    enabled: boolean;
    url: string | null;
    lastUpdate: number;
}

interface ScriptMeta {
    name: string;
    author?: string;
    version?: string;
}

interface ScriptItemData {
    loaded: boolean;
    meta: ScriptMeta;
    filePath: string;
    setting: ScriptSetting;
    content: string;
}

interface V1ConfigItem {
    name: string,
    enabled: boolean,
}

interface V2ConfigItem {
    name: string,
    setting: ScriptSetting,
}

type ConfigItem = V1ConfigItem | V2ConfigItem;