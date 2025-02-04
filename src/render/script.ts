import { EBCContext } from "../bridge";
import { Log } from "./log";

export function evalScript(context: EBCContext, script: ScriptResourceItem) {
  const value = {} as any;

  const _this = Object.freeze({
    window: globalThis.window,
    document: globalThis.document,
    GM_registerMenuCommand: (menuName: string, func?: () => void) => {
      return context.registerMenuCommand(script.meta.name, menuName, func);
    },
    GM_unregisterMenuCommand: (id: number) => {
      context.unregisterMenuCommand(id);
    },
    GM_setValue: (key: string, value: any) => {
      value[key] = value;
    },
    GM_getValue: (key: string, defaultValue: any) => {
      return value[key] || defaultValue;
    },
    GM_deleteValue: (key: string) => {
      delete value[key];
    },
    GM_listValues: () => Object.keys(value),
    GM_log: (message: string) => Log.info(message),
  });

  const wrapSource = (source: string, name: string) => {
    return `
    ${Object.keys(_this)
      .map((key) => `const ${key} = this.${key};`)
      .join("\n")}
    try {
      ${source}
    } catch (e) {
      GM_log("ERROR: Execution of script '${name}' failed! " + e.message);
    }`;
  };

  try {
    const evalFunc = new Function(wrapSource(script.content, script.meta.name));
    evalFunc.call(_this, []);
  } catch (e: any) {
    Log.info(
      `ERROR: Execution of script ${script.meta.name} failed! ${e.message}`
    );
  }
  context.onLoadScriptDoneV2(script.meta.name);
}
