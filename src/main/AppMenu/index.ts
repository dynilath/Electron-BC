import EventEmitter from "events";
import { makeMenu } from "./menu";
import { MyAppMenuConstructorOption } from "./type";

export class MyAppMenu extends EventEmitter<MyAppMenuEvent> {
  constructor(readonly options: MyAppMenuConstructorOption) {
    super();

    this.on("reload", () => {
      const menu = makeMenu(this.options);
      this.options.parent.window.setMenu(menu);
      this.emit("reloaded", menu);
    });
  }
}
