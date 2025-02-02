
export function isV1Config(config: ConfigItem): config is V1ConfigItem {
    const p = config as Partial<V1ConfigItem>;
    return p.enabled !== undefined;
}

export function isV2Config(config: ConfigItem): config is V2ConfigItem {
    const p = config as Partial<V2ConfigItem>;
    return p.setting !== undefined;
}