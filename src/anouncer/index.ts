import { app } from "electron";
import anounce1 from "./anounce1";
import settings from "electron-settings";
import semver from "semver";
import { MyPrompt } from "../bridge";

const SettingTag = "VersionAnouncerConfig";

interface VersionAnouncerConfig {
  lastVersion: string;
}

async function shouldAnouncePred() {
  const config = (await settings.get(
    SettingTag
  )) as VersionAnouncerConfig | null;
  if (!config || !semver.valid(config.lastVersion)) {
    return (_: any) => true;
  }
  return (anounceVer: string) => semver.gt(anounceVer, config.lastVersion);
}

async function queryAnounce() {
  const shouldAnounce = await shouldAnouncePred();
  return [anounce1].find((_) => shouldAnounce(_.version));
}

export async function checkAndAnounce() {
  const lang = app.getLocale().startsWith("zh") ? "CN" : "EN";

  const anounce = await queryAnounce();
  if (anounce) {
    MyPrompt.info(anounce[lang]);
  }
  settings.set(SettingTag, { lastVersion: app.getVersion() });
}
