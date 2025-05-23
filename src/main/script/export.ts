import { ScriptConfig } from "./config";
import { saveScriptFile } from "./resource";
import { ScriptMeta, ScriptResourceItem, ScriptSetting } from "./types";
import zlib from "zlib";
import fs from "fs";

export interface ExportedScriptData {
  meta: ScriptMeta;
  setting: ScriptSetting;
  content: string;
}

export async function exportScript(script: ScriptResourceItem): Promise<ExportedScriptData> {
  return {
    meta: script.meta,
    setting: script.setting,
    content: script.content,
  };
}

export async function importScript(script: ExportedScriptData): Promise<void> {
  await saveScriptFile(script.content, script.meta);
  await ScriptConfig.saveConfig({ name: script.meta.name, setting: script.setting });
}

export function exportScriptPackageBuffer(scripts: ExportedScriptData[]): Buffer {
  const json = JSON.stringify(scripts);
  return zlib.gzipSync(Buffer.from(json, "utf8"));
}

export async function importScriptPackageBuffer(buffer: Buffer): Promise<void> {
  const json = zlib.gunzipSync(buffer).toString("utf8");
  const importData: ExportedScriptData[] = JSON.parse(json);
  for (const s of importData) {
    await importScript(s);
  }
}
