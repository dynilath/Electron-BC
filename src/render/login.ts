import Swal from "sweetalert2";
import { UserInfo } from "../bridge";
import { BCInterface, Bridge } from "./globals";
import { sleep, waitValue } from "./utils";
import { i18n } from "../i18n";
import { Suggestions } from "./suggestion";

export async function loginExt() {
  const userinfo: Partial<UserInfo> = {};

  const onLoginLoad = async () => {
    const username = await waitValue(
      () => document.getElementById("InputName") as HTMLInputElement
    );
    const password = await waitValue(
      () => document.getElementById("InputPassword") as HTMLInputElement
    );

    Suggestions.init(
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

    username.addEventListener("input", () => (userinfo.user = username.value));
    password.addEventListener("input", () => (userinfo.pass = password.value));
  };

  const onLogin = async (user: string, pass: string) => {
    Bridge.instance.trySaveUserPass({ user, pass }).then((saveResult) => {
      if (saveResult.state === "nochange") return;

      Swal.fire({
        title: "Credential Support",
        text:
          saveResult.state == "changed"
            ? `Save password change for ${saveResult.user}?`
            : `Save new credential for ${saveResult.user}?`,
        confirmButtonText: i18n("Alert::Confirm"),
      }).then((result) => {
        if (result.isConfirmed) {
          Bridge.instance.confirmSave(saveResult.handle).then((user) => {
            Swal.fire({
              title: "Credential Support",
              text: `Password for ${user} saved`,
              confirmButtonText: i18n("Alert::Confirm"),
            });
          });
        }
      });
    }, console.error);
  };

  let state = "init" as "init" | "inLogin";

  (async () => {
    await waitValue(
      () =>
        (window as any).ServerSend as (Message: string, ...args: any[]) => void
    ).then((ServerSend) => {
      (window as any)["ServerSend"] = (Message: string, ...args: any[]) => {
        if (Message === "AccountLogin") {
          const arg = args[0] as { AccountName: string; Password: string };
          onLogin(arg.AccountName, arg.Password);
        }
        ServerSend(Message, ...args);
      };
    });
  })();

  while (true) {
    const screen = BCInterface.CurrentScreen;
    const module = BCInterface.CurrentModule;

    if (module === "Character" && screen === "Login") {
      if (state !== "inLogin") {
        state = "inLogin";
        onLoginLoad();
      }
    }
    await sleep(100);
  }
}
