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
    return (window as any)["CommonGetServer"] as ()=> string;
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

  public static LoginDoLogin(Name: string, Password: string): void {
    (window as any)["LoginDoLogin"](Name, Password);
  }

  public static RelogSend(): void {
    (window as any)["RelogSend"]();
  }

  public static get ServerIsConnected() {
    return typingGlobals<boolean>("ServerIsConnected");
  }

  public static get CanLogin() {
    return (
      typingGlobals<boolean>("ServerIsConnected") &&
      !typingGlobals<boolean>("LoginSubmitted")
    );
  }
}

export class Bridge {
  public static get instance(): EBCContext {
    return (window as any)["EBCContext"];
  }
}
