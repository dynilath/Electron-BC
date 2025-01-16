import { handler } from "../handler";

export function showPromptLoadurl(suggestion?: string) {
  handler().then((h) =>
    h.send("show-prompt-loadurl", ...(suggestion ? [suggestion] : []))
  );
}