export class Log {
  static info(message: string, ...args: any[]) {
    console.log(`[Electron-BC] `, message, ...args);
  }
  static error(message: string, ...args: any[]) {
    console.error(`[Electron-BC] `, message, ...args);
  }
}
