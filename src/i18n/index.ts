import EN from './EN';
import CN from './CN';

type LanguageSetting = 'EN' | 'DE' | 'FR' | 'FR' | 'RU' | 'CN';

let global_language: LanguageSetting = 'EN';

const lang_map = new Map<LanguageSetting, Record<TextTag, string>>(
    [['EN', EN], ['CN', CN]]
);

export function i18n(tag: TextTag) {
    const map = lang_map.get(global_language);
    if (map && map[tag]) return map[tag];
    if (EN[tag]) return EN[tag];
    return tag;
}

export function updateLang(lang: string) {
    if (global_language === lang) return { then: (cb: () => void) => { } };
    global_language = lang as LanguageSetting;
    return { then: (cb: () => void) => cb() }
}