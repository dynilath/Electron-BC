import { app } from "electron";
import path from "path";

export function packageFile(file: string) {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app.asar", file)
    : path.join(__dirname, "..", file);
}
