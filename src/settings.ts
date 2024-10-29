import settings from "electron-settings";

const settingsKey = ["credentialSupport"] as const;

class Setting {
  key: string;
  constructor(key: (typeof settingsKey)[number]) {
    this.key = `settings.${key}`;
    if (!settings.hasSync(this.key)) settings.setSync(this.key, false);
  }

  get() {
    return settings.getSync(this.key);
  }

  set(value: boolean) {
    settings.set(this.key, value);
  }
}

export const EBCSetting: Record<(typeof settingsKey)[number], Setting> = {
  credentialSupport: new Setting("credentialSupport"),
};
