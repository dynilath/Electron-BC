import { ScriptState } from "../script/state";

export interface MyAppMenuConstructorOption {
  BCVersion: { url: string; version: string };
  refreshPage: () => Promise<void>;
  mainWindow: Electron.BrowserWindow;
  scriptState: ScriptState;
  i18n: (tag: TextTag) => string;
}
