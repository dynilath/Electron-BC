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
            username.value = user;
            password.value = pass;
            BCInterface.LoginDoLogin();
          })
          .catch(console.error)
    );

    username.addEventListener("input", () => (userinfo.user = username.value));
    password.addEventListener("input", () => (userinfo.pass = password.value));
  };

  const onLogin = async (user: string, pass: string) => {
    Bridge.instance.clientLogin({ user, pass }).then((saveResult) => {
      if (saveResult.state === "nochange") return;
      Swal.fire({
        title: i18n("Alert::Credential::Title"),
        text: (saveResult.state == "changed"
          ? i18n("Alert::Credential::Change")
          : i18n("Alert::Credential::New")
        ).replace("USERNAME", saveResult.user),
        confirmButtonText: i18n("Alert::Confirm"),
        cancelButtonText: i18n("Alert::Cancel"),
      }).then((result) => {
        if (result.isConfirmed) {
          Bridge.instance.saveUserPass().then((user) => {
            Swal.fire({
              title: i18n("Alert::Credential::Title"),
              text: i18n("Alert::Credential::Saved").replace(
                "USERNAME",
                saveResult.user
              ),
              confirmButtonText: i18n("Alert::Confirm"),
            });
          });
        }
      });
    }, console.error);
  };

  (async () => {
    await waitValue(
      () =>
        (window as any).ServerSend as (Message: string, ...args: any[]) => void
    ).then((ServerSend) => {
      (window as any)["ServerSend"] = (Message: string, ...args: any[]) => {
        if (
          Message === "AccountLogin" &&
          BCInterface.CurrentScreen === "Login"
        ) {
          const arg = args[0] as { AccountName: string; Password: string };
          onLogin(arg.AccountName, arg.Password);
        }
        ServerSend(Message, ...args);
      };
    });
  })();

  (async () => {
    let state = "init" as "init" | "inLogin";
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
  })();

  (async () => {
    let state = "init" as "init" | "inRelog";
    while (true) {
      const screen = BCInterface.CurrentScreen;
      const module = BCInterface.CurrentModule;

      if (module === "Character" && screen === "Relog") {
        if (state !== "inRelog") {
          state = "inRelog";
          Bridge.instance.clientRelog().then(({ pass }) => {
            waitValue(
              () => document.getElementById("InputPassword") as HTMLInputElement
            ).then((password) => {
              password.value = pass;
              BCInterface.RelogSend();
            });
          });
        }
      }

      await sleep(200);
    }
  })();
}
