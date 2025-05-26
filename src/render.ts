import { initGlobal, updateLang } from "./i18n";
import { BCInterface, Bridge } from "./render/globals";
import { waitValue } from "./render/utils";
import Dexie from "dexie";
import { loginExt } from "./render/login";
import { evalScript } from "./render/script";
import { Log } from "./render/log";

initGlobal();

(window as any).Dexie = Dexie;

Bridge.instance.onLoadScriptV2((script) => {
  Log.info("Load-Script : " + JSON.stringify(script.meta));
  evalScript(Bridge.instance, script);
});

Bridge.instance.onReload(() => location.reload());

Bridge.instance.register().then((ticket) => loginExt(ticket));

Bridge.instance.onGetServer(() => {
  console.log("GetServer");
  return BCInterface.CommonGetServer();
});

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

  waitValue(() => document.getElementById("LanguageDropdown")).then((element) =>
    element.addEventListener("change", () => emitLang())
  );

  window.alert = (message?: string) => {
    Bridge.instance.alert(BCInterface.TranslationLanguage, message);
  };
})();
