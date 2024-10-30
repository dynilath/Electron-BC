import { ipcRenderer } from "electron";
import { ScriptItem } from "../SimpleScriptManager/ScriptItem";

export interface UserInfo {
  user: string;
  pass: string;
}

export type SaveUserPassResult =
  | { state: "new" | "changed"; user: string; handle: string }
  | { state: "nochange" };

export interface EBCContext {
  register: () => void;
  queryUserPassSuggestion: (source?: string) => Promise<string[]>;
  selectUserPass: (source: string) => Promise<UserInfo>;
  trySaveUserPass: (userinfo: UserInfo) => Promise<SaveUserPassResult>;
  saveUserPass: (handle: string) => Promise<string>;

  languageChange: (lang: string | undefined) => void;
  loadScriptDone: (scriptName: string) => void;
  loadScriptUrl: (url: string) => void;

  onReload: (callback: () => void) => void;
  onPromptLoadUrl: (callback: (script: any) => void) => void;
  onLoadScript: (callback: (script: ScriptItem) => void) => void;
}

function testCredentialSetting(): Promise<void> {
  return new Promise((resolve) =>
    ipcRenderer.invoke("settings-test", "credentialSupport").then((value) => {
      if (value) resolve();
    })
  );
}

export function createCtxBridge(): EBCContext {
  return {
    register: () => {
      ipcRenderer.send("handler-register");
    },

    queryUserPassSuggestion: (source?: string) =>
      testCredentialSetting().then(
        () =>
          new Promise((resolve) => {
            ipcRenderer
              .invoke("credential-query-suggestion", source)
              .then((r) => resolve(r as string[]));
          })
      ),
    selectUserPass: (username: string) =>
      testCredentialSetting().then(
        () =>
          new Promise((resolve) => {
            ipcRenderer
              .invoke("credential-query-select", username)
              .then((r) => resolve(r as UserInfo));
          })
      ),
    trySaveUserPass: (userinfo): Promise<SaveUserPassResult> =>
      testCredentialSetting().then(() =>
        ipcRenderer.invoke("credential-try-save", userinfo)
      ),
    saveUserPass: (handle): Promise<string> =>
      testCredentialSetting().then(() =>
        ipcRenderer.invoke("credential-save", handle)
      ),

    languageChange: async (lang: string | undefined) => {
      if (lang) ipcRenderer.send("language-change", lang);
    },
    loadScriptDone: async (scriptName: string) => {
      ipcRenderer.send("load-script-done", scriptName);
    },
    loadScriptUrl: async (url: string) => {
      ipcRenderer.send("load-script-url", url);
    },

    onReload: (callback: () => void) => {
      ipcRenderer.on("reload", callback);
    },
    onPromptLoadUrl: (callback: (script: any) => void) => {
      ipcRenderer.on("show-prompt-loadurl", callback);
    },
    onLoadScript: (callback: (script: ScriptItem) => void) => {
      ipcRenderer.on("load-script", (e, script) => callback(script));
    },
  };
}
