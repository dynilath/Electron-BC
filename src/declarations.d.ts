declare module "*.html" {
  const content: string;
  export default content;
}

declare interface BCVersion {
  url: string;
  version: string;
}

type MyEvent =
  | "load-script"
  | "load-script-done"
  | "reload-menu"
  | "load-script-url"
  | "language-change"
  | "setting-test"
  | "page-loaded"
  | "credential-client-login"
  | "credential-save"
  | "credential-relog"
  | "comfirm-cancel-prompt"
  | "confirm-cancel-prompt-reply"
  | "load-script-v2"
  | "load-script-done-v2"
  | "invoke-menu-command"
  | "register-menu-command"
  | "remove-menu-command";
