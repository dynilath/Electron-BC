import EN from './EN';
import CN from './CN';

type LanguageSetting = 'EN' | 'DE' | 'FR' | 'FR' | 'RU' | 'CN';

let global_language: LanguageSetting = 'EN';

const lang_map = new Map<LanguageSetting, Map<string, string>>(
    [['EN', EN], ['CN', CN]]
);

export function i18n(tag: string) {
    const map = lang_map.get(global_language);
    if (map && map.has(tag)) return map.get(tag);
    if (EN.has(tag)) return EN.get(tag);
    return tag;
}

export function updateLang(lang: string) {
    if (global_language === lang) return { then: (cb: () => void) => { } };
    global_language = lang as LanguageSetting;
    return { then: (cb: () => void) => cb() }
}