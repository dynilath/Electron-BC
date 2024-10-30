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

  public static set CommonGetServer(new_func: () => string) {
    (window as any)["CommonGetServer"] = new_func;
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

  public static RelogSend(): void {
    (window as any)["RelogSend"]();
  }

  public static get ServerIsConnected() {
    return typingGlobals<boolean>("ServerIsConnected");
  }
}

export class Bridge {
  public static get instance(): EBCContext {
    return (window as any)["EBCContext"];
  }
}