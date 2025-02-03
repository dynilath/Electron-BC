import { ipcMain } from "electron";

type OnParams = [
  channel: MyEvent,
  ...Rest: Parameters<typeof ipcMain.on> extends [any, ...infer R] ? R : never
];

type EmitParams = [
  eventName: MyEvent,
  ...Rest: Parameters<typeof ipcMain.emit> extends [any, ...infer R] ? R : never
];

type ReParams = [
  channel: MyEvent,
  ...Rest: Parameters<typeof ipcMain.removeListener> extends [any, ...infer R]
    ? R
    : never
];

export function mainHandler(...args: OnParams) {
  ipcMain.on(...args);
}

export function mainEmit(...args: EmitParams) {
  ipcMain.emit(...args);
}

export function mainHandlerRemove(...args: ReParams) {
  ipcMain.removeListener(...args);
}
