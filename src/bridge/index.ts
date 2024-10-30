import { ipcRenderer } from "electron";
import { ScriptItem } from "../SimpleScriptManager/ScriptItem";
import { SettingsKey } from "../settings";

export interface UserInfo {
  user: string;
  pass: string;
}

export type SaveUserPassResultRaw = {
  state: "new" | "changed" | "nochange";
  user: string;
};

export type SaveUserPassResult = SaveUserPassResultRaw & {
  handle: string;
};

export interface EBCContext {
  register: () => void;
  queryUserPassSuggestion: (source?: string) => Promise<string[]>;
  selectUserPass: (source: string) => Promise<UserInfo>;
  clientLogin: (userinfo: UserInfo) => Promise<SaveUserPassResultRaw>;
  saveUserPass: () => Promise<string>;
  clientRelog: () => Promise<UserInfo>;

  languageChange: (lang: string | undefined) => void;
  loadScriptDone: (scriptName: string) => void;
  loadScriptUrl: (url: string) => void;

  onReload: (callback: () => void) => void;
  onPromptLoadUrl: (callback: (script: any) => void) => void;
  onLoadScript: (callback: (script: ScriptItem) => void) => void;
}

function testSetting(key: SettingsKey): Promise<void> {
  return new Promise((resolve) =>
    ipcRenderer.invoke("settings-test", key).then((value) => {
      if (value) resolve();
    })
  );
}

const session = {
  userHandle: undefined as string | undefined,
};

export function createCtxBridge(): EBCContext {
  return {
    register: () => {
      ipcRenderer.send("handler-register");
    },

    queryUserPassSuggestion: (source?: string) =>
      testSetting("credentialSupport").then(
        () =>
          new Promise((resolve) => {
            ipcRenderer
              .invoke("credential-query-suggestion", source)
              .then((r) => resolve(r as string[]));
          })
      ),
    selectUserPass: (username: string) =>
      testSetting("credentialSupport").then(
        () =>
          new Promise((resolve) => {
            ipcRenderer
              .invoke("credential-query-select", username)
              .then((r) => resolve(r as UserInfo));
          })
      ),
    clientLogin: (userinfo): Promise<SaveUserPassResultRaw> =>
      testSetting("credentialSupport")
        .then(() => ipcRenderer.invoke("credential-client-login", userinfo))
        .then((result) => {
          session.userHandle = result.handle;
          return { state: result.state, user: result.user };
        }),
    saveUserPass: (): Promise<string> =>
      testSetting("credentialSupport").then(() => {
        if (session.userHandle)
          return ipcRenderer.invoke("credential-save", session.userHandle);
      }),
    clientRelog: () =>
      testSetting("credentialSupport")
        .then(() => testSetting("autoRelogin"))
        .then(() => {
          if (session.userHandle)
            return ipcRenderer.invoke("credential-relog", session.userHandle);
        }),

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
