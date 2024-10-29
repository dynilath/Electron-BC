import { app, ipcMain } from "electron";

import keytar from "keytar";
import { SaveUserPassResult, UserInfo } from "./bridge";

const serviceName = app.name;

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
  const credits = await keytar.findCredentials(serviceName);
  return credits
    .filter((i) => i.account.includes(account))
    .map((i) => i.account);
});

function randomString() {
  return Math.random().toString(16).substring(2);
}

const tempCredentialMap = new Map<string, { user: string; pass: string }>();

ipcMain.handle(
  "credential-try-save",
  async (event, { user, pass }): Promise<SaveUserPassResult> => {
    const oldPass = await keytar.getPassword(serviceName, pass);
    const handle = randomString();
    tempCredentialMap.set(handle, { user, pass });

    if (oldPass === null) return { state: "new", user, handle };
    if (oldPass == pass) return { state: "nochange" };
    return { state: "changed", user, handle };
  }
);

ipcMain.handle("credential-save", (event, { handle }) => {
  return new Promise((resolve, reject) => {
    const saved = tempCredentialMap.get(handle);
    if (saved) {
      keytar.setPassword(serviceName, saved.user, saved.pass);
      resolve(saved.user);
    } else {
      reject(`Invalid Handle: ${handle}`);
    }
  });
});
