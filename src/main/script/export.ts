import { ScriptConfig } from "./config";
import { saveScriptFile } from "./resource";

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
