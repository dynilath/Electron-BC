import { EBCContext } from "../bridge";

function typingGlobals<T>(key: string) {
  return (window as any)[key] as T;
}

export class BCInterface {
  public static get CurrentModule() {
    return typingGlobals<string>("CurrentModule");
  }

  public static get CurrentScreen() {
    return typingGlobals<string>("CurrentScreen");
  }

  public static get CommonGetServer() {
    return typingGlobals<() => string>("CommonGetServer");
  }

  public static get TranslationLanguage() {
    return typingGlobals<string>("TranslationLanguage");
  }

  public static get TranslationLoad() {
    return typingGlobals<() => void>("TranslationLoad");
  }

  public static set TranslationLoad(new_func: () => void) {
    (window as any)["TranslationLoad"] = new_func;
  }

  public static LoginDoLogin(): void {
    (window as any)["LoginDoLogin"]();
  }
}

export class Bridge {
  public static get instance(): EBCContext {
    return (window as any)["EBCContext"];
  }
}
