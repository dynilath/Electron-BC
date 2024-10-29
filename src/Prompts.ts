import { handler } from "./handler";

export function showPromptLoadurl() {
    handler().then(h => h.send('show-prompt-loadurl'));
}