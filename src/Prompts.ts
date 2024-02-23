import { handler } from "./handler";
import { i18n } from "./i18n";

export function showPromptLoadurl() {
    handler().then(h => {
        h.send('show-prompt-loadurl', {
            title: i18n('Alert::LoadUrl::Input script URL'),
            confirm: i18n('Alert::LoadUrl::Confirm'),
            cancel: i18n('Alert::LoadUrl::Cancel'),
            please: i18n('Alert::LoadUrl::Please input Correct'),
        });
    })
}