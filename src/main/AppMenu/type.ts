import { PromptParent } from "../../prompt/types";
import { ScriptState } from "../script/state";

export interface MyAppMenuConstructorOption {
  BCVersion: { url: string; version: string };
  refreshPage: () => Promise<void>;
  scriptState: ScriptState;
  parent: PromptParent;
}
