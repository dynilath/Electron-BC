import Swal from "sweetalert2";
import { UserInfo } from "../bridge";
import { BCInterface, Bridge } from "./globals";
import { acquire, sleep } from "./utils";
import { i18n } from "../i18n";

(async () => {
  const userinfo: Partial<UserInfo> = {};

  const onLoginLoad = async () => {
    acquire({
      username: () => document.getElementById("InputName") as HTMLInputElement,
      password: () =>
        document.getElementById("InputPassword") as HTMLInputElement,
    })
      .then(({ username, password }) => {
        const suggestion = new Suggestions(
          username,
          async (src) => Bridge.instance.queryUserPassSuggestion(src),
          async (select) =>
            Bridge.instance
              .selectUserPass(select)
              .then(({ user, pass }) => {
                username.textContent = user;
                password.textContent = pass;
                BCInterface.LoginDoLogin();
              })
              .catch(console.error)
        );

        username.addEventListener(
          "input",
          () => (userinfo.user = username.value)
        );
        password.addEventListener(
          "input",
          () => (userinfo.pass = password.value)
        );
      })
      .catch(console.error);
  };

  const onLoginFinish = async () => {
    if (userinfo.user && userinfo.pass)
      Bridge.instance
        .trySaveUserPass(userinfo as UserInfo)
        .then((saveResult) => {
          if (saveResult.state === "nochange") return;

          Swal.fire({
            title: "Electron-BC Credential Support",
            text:
              saveResult.state == "changed"
                ? `Save password change for ${saveResult.user}?`
                : `Save new credential for ${saveResult.user}?`,
            confirmButtonText: i18n("Alert::Confirm"),
          }).then((result) => {
            if (result.isConfirmed) {
              Bridge.instance.confirmSave(saveResult.handle).then((user) => {
                Swal.fire({
                  title: "Electron-BC Credential Support",
                  text: `Password for ${user} saved`,
                  confirmButtonText: i18n("Alert::Confirm"),
                });
              });
            }
          });
        }, console.error);
  };

  let state = "init" as "init" | "inLogin";

  while (true) {
    const screen = BCInterface.CurrentScreen;
    const module = BCInterface.CurrentModule;

    if (module === "Character" && screen === "Login") {
      if (state !== "inLogin") {
        state = "inLogin";
        onLoginLoad();
      }
    } else if (module === "Room") {
      if (state === "inLogin") {
        onLoginFinish();
        state = "init";
      }
    } else {
      state = "init";
    }

    await sleep(100);
  }
})();
