import { app } from "electron";
import path from "path";

export function packageFile(file: string) {
  return app.isPackaged
    ? path.join(process.resourcesPath, "app.asar", file)
    : path.join(__dirname, "..", file);
}

export class PendingAccess<T extends object> {
  private object: T | undefined = undefined;

  private queue: (() => void)[] = [];

  constructor(obj?: T) {
    this.object = obj;
  }

  async aquire() {
    if (this.object) return this.object;
    return new Promise<T>((resolve) => {
      this.queue.push(() => {
        resolve(this.object!);
      });
    });
  }

  test() {
    return this.object !== undefined;
  }

  invalidate() {
    const old = this.object;
    this.object = undefined;
    return old;
  }

  release(obj: T) {
    this.object = obj;

    const queue = this.queue;
    this.queue = [];

    for (const resolve of queue) {
      resolve();
    }
  }
}