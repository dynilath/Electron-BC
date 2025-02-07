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

interface ScriptResourceItem {
  setting: ScriptSetting;
  file: string;
  meta: ScriptMeta;
  content: string;
}

interface ScriptConfigItem {
  name: string;
  setting: ScriptSetting;
}

interface ScriptMenuItem {
  id: number;
  scriptName: string;
  menuName: string;
}