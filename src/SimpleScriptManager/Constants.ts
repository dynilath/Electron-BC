
import * as path from 'path';
import * as fs from 'fs';
import { app, shell } from "electron";

export type ScriptMeta = {
    Meta: {
        name: string,
        namespace: string,
        version: string,
        description: string,
        author: string,
        match: string[],
        icon: string,
    },
    Script: string,
};

const DataPath = path.join(app.getPath('appData'), 'Bondage Club', 'Electron App');

function AssureDataPath() {
    if (!fs.existsSync(DataPath)) {
        fs.mkdirSync(DataPath, { recursive: true });
    }
}

export function GetDataPath() {
    AssureDataPath();
    return DataPath;
}

export function OpenScriptFolder() {
    AssureDataPath();
    shell.openPath(GetDataPath());
}