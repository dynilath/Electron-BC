import { app, ipcMain } from "electron";

import keytar from "keytar";
import { SaveUserPassResult, UserInfo } from "../bridge";

const serviceName = app.name;

export function initCredentialHandler() {
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

  function randomString() {
    return Math.random().toString(16).substring(2);
  }

  const tempCredentialMap = new Map<string, { user: string; pass: string }>();

  ipcMain.handle(
    "credential-try-save",
    async (event, { user, pass }): Promise<SaveUserPassResult> => {
      const oldPass = await keytar.getPassword(serviceName, user);
      if (oldPass == pass) return { state: "nochange" };

      const handle = randomString();
      tempCredentialMap.set(handle, { user, pass });
      if (oldPass === null) return { state: "new", user, handle };
      return { state: "changed", user, handle };
    }
  );

  ipcMain.handle("credential-save", (event, handle) => {
    const saved = tempCredentialMap.get(handle);
    if (saved) {
      keytar.setPassword(serviceName, saved.user, saved.pass);
      return Promise.resolve(saved.user);
    } else {
      return Promise.reject(`Invalid Handle: ${handle}`);
    }
  });
}
