import EN from './EN';
import CN from './CN';

type LanguageSetting = 'EN' | 'DE' | 'FR' | 'FR' | 'RU' | 'CN';

const lang_map = new Map<LanguageSetting, Record<TextTag, string>>([
  ["EN", EN],
  ["CN", CN],
]);

let global_instance: i18nText | null = null;

export function initGlobal() {
  global_instance = new i18nText();
}

export function i18n(tag: TextTag) {
  return global_instance!.get(tag);
}

export function updateLang(lang: string) {
  global_instance!.update(lang);
}

export class i18nText {
  language: LanguageSetting = "EN";
  constructor() {}

  get(tag: TextTag) {
    const map = lang_map.get(this.language);
    if (map && map[tag]) return map[tag];
    if (EN[tag]) return EN[tag];
    return tag;
  }

  translate(src: Partial<Record<LanguageSetting, string>>) {
    if (src[this.language]) return src[this.language]!;
    return src.EN || Object.entries(src)[0][1] || "";
  }

  update(lang: string) {
    this.language = lang as LanguageSetting;
  }
}