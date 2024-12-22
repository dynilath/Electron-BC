import Swal from "sweetalert2";
import { UserInfo } from "../bridge";
import { BCInterface, Bridge } from "./globals";
import { sleep, waitValue } from "./utils";
import { i18n } from "../i18n";
import { Suggestions } from "./suggestion";
import { Log } from "./log";

export async function loginExt(ticket: string) {
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
      async (src) => Bridge.instance.queryUserPassSuggestion(ticket, src),
      async (select) =>
        Bridge.instance
          .selectUserPass(ticket, select)
          .then(({ user, pass }) => {
            Log.info("Account selected: ", user);
            username.value = user;
            password.value = pass;
            BCInterface.LoginDoLogin(user, pass);
          })
          .catch(console.error)
    );

    username.addEventListener("input", () => (userinfo.user = username.value));
    password.addEventListener("input", () => (userinfo.pass = password.value));
  };

  const onLogin = async (user: string, pass: string) => {
    Bridge.instance.clientLogin(ticket, { user, pass }).then((saveResult) => {
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
          Bridge.instance.saveUserPass(ticket).then((user) => {
            Log.info("Account saved: ", user);
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
          if (
            typeof arg.AccountName === "string" &&
            typeof arg.Password === "string"
          )
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
      } else {
        state = "init";
      }
      await sleep(100);
    }
  })();

  (async () => {
    let state = "init" as "init" | "inRelog";
    while (true) {
      const screen = BCInterface.CurrentScreen;
      const module = BCInterface.CurrentModule;

      if (
        module === "Character" &&
        screen === "Relog" &&
        BCInterface.CanLogin
      ) {
        if (state !== "inRelog") {
          state = "inRelog";
          Log.info("Detected relogin screen");
          Bridge.instance.clientRelog(ticket).then(({ user, pass }) => {
            waitValue(
              () => document.getElementById("InputPassword") as HTMLInputElement
            ).then((password) => {
              Log.info("Relogging");
              BCInterface.LoginDoLogin(user, pass);
              state = "init";
            });
          });
        }
      } else {
        state = "init";
      }

      await sleep(200);
    }
  })();
}
