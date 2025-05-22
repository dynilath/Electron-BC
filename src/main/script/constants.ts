
import * as path from 'path';
import * as fs from 'fs';
import { app, shell } from "electron";

export const SettingTag = 'ScriptManagerConfig';

const DataPath = path.join(app.getPath('appData'), 'Bondage Club', 'Electron App');

function AssureDataPath() {
    if (!fs.existsSync(DataPath)) {
        fs.mkdirSync(DataPath, { recursive: true });
    }
}

export function getScriptFolder() {
  AssureDataPath();
  return DataPath;
}

export function openScriptFolder() {
  AssureDataPath();
  shell.openPath(getScriptFolder());
}