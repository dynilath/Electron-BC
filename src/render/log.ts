const impl = Object.freeze({
  info: new Function(
    "message",
    "args",
    `console.log("[Electron-BC]", message, ...args)`
  ),
  error: new Function(
    "message",
    "args",
    `console.error("[Electron-BC]", message, ...args)`
  ),
});

export class Log {
  static info = (message: string, ...args: any[]) => impl.info(message, args);
  static error = (message: string, ...args: any[]) => impl.error(message, args);
}
