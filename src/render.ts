import Swal from "sweetalert2";
import { initGlobal, i18n, updateLang } from "./i18n";
import { BCInterface, Bridge } from "./render/globals";
import { waitValue } from "./render/utils";
import Dexie from "dexie";
import { loginExt } from "./render/login";
import { evalScript } from "./render/script";
import { Log } from "./render/log";

initGlobal();

(window as any).Dexie = Dexie;

Bridge.instance.onPromptLoadUrl((suggestion) => {
  // from https://stackoverflow.com/questions/3809401 with '.js' added
  const urlRegex =
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,32}\b([-a-zA-Z0-9()@:%_\+.~#?&\/=]*)\.js$/;

  Swal.fire({
    title: i18n("Alert::LoadUrl::InputScriptURL"),
    confirmButtonText: i18n("Alert::Confirm"),
    cancelButtonText: i18n("Alert::Cancel"),
    input: "text",
    inputPlaceholder: "https://example.com/script.user.js",
    showCancelButton: true,
    ...(suggestion ? { inputValue: suggestion } : {}),
    inputValidator: (value) => {
      if (!value || !urlRegex.test(value))
        return i18n("Alert::LoadUrl::PleaseInputCorrectUrl");
    },
  }).then((result) => {
    if (result.isConfirmed) {
      Bridge.instance.loadScriptUrl(result.value as string);
    }
  });
});

Bridge.instance.onLoadScriptV2((script) => {
  Log.info("Load-Script : " + JSON.stringify(script.meta));
  evalScript(Bridge.instance, script);
});

Bridge.instance.onInfoPrompt((message) => {
  Swal.fire({
    html: message,
    confirmButtonText: i18n("Alert::Confirm"),
  });
});

Bridge.instance.onConfirmCancelPrompt((message, key) => {
  Swal.fire({
    html: i18n(message),
    showCancelButton: true,
    confirmButtonText: i18n("Alert::Confirm"),
    cancelButtonText: i18n("Alert::Cancel"),
  }).then((result) => {
    Bridge.instance.confirmCancelPromptReply(key, result.isConfirmed);
  });
});

Bridge.instance.onReload(() => location.reload());

Bridge.instance.register().then((ticket) => loginExt(ticket));

(async () => {
  const emitLang = () => {
    Bridge.instance.languageChange(BCInterface.TranslationLanguage);
    updateLang(BCInterface.TranslationLanguage);
  };

  let oldTranslationLoad = BCInterface.TranslationLoad;
  BCInterface.TranslationLoad = () => {
    oldTranslationLoad();
    emitLang();
  };

  waitValue(() => document.getElementById("LanguageDropdown-select")).then(
    (element) => element.addEventListener("change", () => emitLang())
  );

  window.alert = (message?: string) => {
    Swal.fire({
      title: i18n("Alert::Title"),
      text: message,
      confirmButtonText: i18n("Alert::Confirm"),
    });
  };
})();
