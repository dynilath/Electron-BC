import { ipcMain } from "electron";
import settings from "electron-settings";

const settingsKey = ["credentialSupport"] as const;

class Setting {
  key: string;
  constructor(key: (typeof settingsKey)[number]) {
    this.key = `settings.${key}`;
    settings.has(this.key).then((hasKey) => {
      if (!hasKey) settings.set(this.key, false);
    });
  }

  get() {
    return settings.getSync(this.key) as boolean;
  }

  set(value: boolean) {
    return settings.set(this.key, value);
  }

  toggle() {
    return settings
      .get(this.key)
      .then((value) => settings.set(this.key, !value))
      .then(() => Promise.resolve());
  }
}

export const EBCSetting: Record<(typeof settingsKey)[number], Setting> = {
  credentialSupport: new Setting("credentialSupport"),
};

ipcMain.handle("settings-test", (event, key: (typeof settingsKey)[number]) => {
  return Promise.resolve(EBCSetting[key].get());
});
