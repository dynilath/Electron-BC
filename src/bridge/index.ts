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
  register: () => Promise<string>;
  queryUserPassSuggestion: (
    ticket: string,
    source?: string
  ) => Promise<string[]>;
  selectUserPass: (ticket: string, source: string) => Promise<UserInfo>;
  clientLogin: (
    ticket: string,
    userinfo: UserInfo
  ) => Promise<SaveUserPassResultRaw>;
  saveUserPass: (ticket: string) => Promise<string>;
  clientRelog: (ticket: string) => Promise<UserInfo>;

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

export function createCtxBridge(): EBCContext {
  const session = {
    ticket: undefined as string | undefined,
    userHandle: undefined as string | undefined,
  };

  const testTicket = (ticket: string) =>
    new Promise<void>((resolve) => {
      if (session.ticket === ticket) resolve();
    });

  return {
    register: () => {
      if (session.ticket === undefined)
        session.ticket = Math.random().toString(16).substring(2);
      ipcRenderer.send("handler-register");
      return Promise.resolve(session.ticket);
    },

    queryUserPassSuggestion: (ticket: string, source?: string) =>
      testTicket(ticket)
        .then(() => testSetting("credentialSupport"))
        .then(
          () =>
            new Promise((resolve) => {
              ipcRenderer
                .invoke("credential-query-suggestion", source)
                .then((r) => resolve(r as string[]));
            })
        ),
    selectUserPass: (ticket: string, username: string) =>
      testTicket(ticket)
        .then(() => testSetting("credentialSupport"))
        .then(
          () =>
            new Promise((resolve) => {
              ipcRenderer
                .invoke("credential-query-select", username)
                .then((r) => resolve(r as UserInfo));
            })
        ),
    clientLogin: (ticket: string, userinfo): Promise<SaveUserPassResultRaw> =>
      testTicket(ticket)
        .then(() => testSetting("credentialSupport"))
        .then(() => ipcRenderer.invoke("credential-client-login", userinfo))
        .then((result) => {
          session.userHandle = result.handle;
          return { state: result.state, user: result.user };
        }),
    saveUserPass: (ticket: string): Promise<string> =>
      testTicket(ticket)
        .then(() => testSetting("credentialSupport"))
        .then(() => {
          if (session.userHandle)
            return ipcRenderer.invoke("credential-save", session.userHandle);
        }),
    clientRelog: (ticket: string) =>
      testTicket(ticket)
        .then(() => testSetting("credentialSupport"))
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
