import { app, BrowserWindow, ipcMain } from "electron";

import keytar from "keytar";
import { SaveUserPassResult, UserInfo } from "../bridge";
import { randomString } from "../utility";
import EventEmitter from "node:events";
import { MyPrompt, PromptParent } from "./MyPrompt";

const serviceName = app.name;

type LoginState = "nochange" | "new" | "changed";

interface EventMap {
  "client-logined": [
    event: Electron.IpcMainEvent,
    state: LoginState,
    user: string,
    pass: string
  ];
}

const loginEvents = new EventEmitter<EventMap>();

function initCredentialHandler() {
  ipcMain.handle(
    "credential-query-select",
    (event, source): Promise<UserInfo> => {
      return new Promise((resolve, reject) => {
        keytar.getPassword(serviceName, source).then((result) => {
          if (result) resolve({ user: source, pass: result });
          else reject(`Credential Not Found : ${source}`);
        });
      });
    }
  );

  ipcMain.handle("credential-query-suggestion", async (event, account) => {
    const lacc = account.toLowerCase();
    const credentials = await keytar.findCredentials(serviceName);
    return credentials
      .filter((i) => !account || i.account.toLowerCase().includes(lacc))
      .map((i) => i.account);
  });

  const tempCredentialMap = new Map<string, { user: string; pass: string }>();

  ipcMain.on("credential-client-login", async (event, { user, pass }) => {
    const handle = randomString();
    tempCredentialMap.set(handle, { user, pass });

    const oldPass = await keytar.getPassword(serviceName, user);
    const state =
      oldPass === pass ? "nochange" : oldPass === null ? "new" : "changed";

    loginEvents.emit("client-logined", event, state, user, pass);

    // if (oldPass == pass) return { state: "nochange", user, handle };
    // if (oldPass === null) return { state: "new", user, handle };
    // return { state: "changed", user, handle };
  });

  ipcMain.handle("credential-save", (event, handle) => {
    const saved = tempCredentialMap.get(handle);
    if (saved) {
      keytar.setPassword(serviceName, saved.user, saved.pass);
      return Promise.resolve(saved.user);
    } else {
      return Promise.reject(`Invalid Handle: ${handle}`);
    }
  });

  ipcMain.handle("credential-relog", (event, handle): Promise<UserInfo> => {
    const saved = tempCredentialMap.get(handle);
    if (saved) {
      return Promise.resolve(saved);
    } else {
      return Promise.reject(`Invalid Handle: ${handle}`);
    }
  });
}

function createOnLoginListener(parent: PromptParent) {
  return ((event, state, user, pass) => {
    if (event.sender.id !== parent.window.webContents.id) return;
    MyPrompt.confirmCancel(
      parent,
      (state == "changed"
        ? parent.i18n("Alert::Credential::Change")
        : parent.i18n("Alert::Credential::New")
      ).replace("USERNAME", user),
      () => {
        keytar.setPassword(serviceName, user, pass);
        MyPrompt.confirmCancel(
          parent,
          parent.i18n("Alert::Credential::Saved").replace("USERNAME", user),
          () => {}
        );
      }
    );
  }) as (...args: EventMap["client-logined"]) => void;
}

export const Credential = {
  init: initCredentialHandler,
  loginEvents,
  createOnLoginListener,
};
