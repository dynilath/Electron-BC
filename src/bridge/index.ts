import { ipcRenderer } from "electron";
import { SettingsKey } from "../settings";
import { randomString } from "../utility";

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
  onPromptLoadUrl: (callback: (scriptSuggestion?: string) => void) => void;
  onInfoPrompt: (callback: (message: string) => void) => void;
  onConfirmCancelPrompt: (
    callback: (message: TextTag, key: string) => void
  ) => void;
  confirmCancelPromptReply: (key: string, confirm: boolean) => void;
  onLoadScriptV2: (callback: (script: ScriptResourceItem) => void) => void;
  onLoadScriptDoneV2: (scriptName: string) => void;
  registerMenuCommand: (
    scriptName: string,
    menuName: string,
    callback?: () => void
  ) => number;
  unregisterMenuCommand: (id: number) => void;
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

  let menuCommandCounter = 0;
  const menuCommands = new Map<number, () => void>();

  ipcRenderer.on("invoke-menu-command", (e, id: number) => {
    const func = menuCommands.get(id);
    if (func) func();
  });

  return {
    register: () => {
      if (session.ticket === undefined) session.ticket = randomString();
      ipcRenderer.send("page-loaded", session.ticket);
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
    onPromptLoadUrl: (callback: (scriptSuggestion?: string) => void) => {
      ipcRenderer.on("show-prompt-loadurl", (e, scriptSuggestion) =>
        callback(scriptSuggestion)
      );
    },
    onInfoPrompt: (callback: (message: string) => void) => {
      ipcRenderer.on("info-prompt", (e, message) => callback(message));
    },
    onConfirmCancelPrompt: (
      callback: (message: TextTag, key: string) => void
    ) => {
      ipcRenderer.on("confirm-cancel-prompt", (e, message, key) =>
        callback(message, key)
      );
    },
    confirmCancelPromptReply: (key: string, confirm: boolean) => {
      ipcRenderer.send("confirm-cancel-prompt-reply", key, confirm);
    },

    onLoadScriptV2: (callback: (script: ScriptResourceItem) => void) => {
      ipcRenderer.on("load-script-v2", (e, script) => callback(script));
    },
    onLoadScriptDoneV2: (scriptName: string) => {
      ipcRenderer.send("load-script-done-v2", scriptName);
    },
    registerMenuCommand: (
      scriptName: string,
      menuName: string,
      callback?: () => void
    ) => {
      const ret = menuCommandCounter++;
      if (callback) menuCommands.set(ret, () => callback());
      ipcRenderer.send("register-menu-command", ret, scriptName, menuName);
      return ret;
    },
    unregisterMenuCommand: (id: number) => {
      ipcRenderer.send("remove-menu-command", id);
      menuCommands.delete(id);
    },
  };
}
