import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en/common.json';
import bn from './locales/bn/common.json';

/**
 * Multilingual support (v4.11.0) — English default + বাংলা.
 *
 * CONTRIBUTOR GUIDE: to translate, copy `src/locales/en/common.json` to
 * `src/locales/<lang>/common.json`, translate the VALUES only (never the
 * keys), and register the language below + in Settings' language picker.
 * Quran/hadith references and Arabic text are intentionally NOT in these
 * files — evidence must never pass through a translation layer.
 *
 * Untranslated keys automatically fall back to English, so partial
 * translations are always safe to ship.
 */
export const LANGUAGES = [
  { id: 'en', label: 'English' },
  { id: 'bn', label: 'বাংলা (Bengali)' },
] as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: en },
      bn: { common: bn },
    },
    defaultNS: 'common',
    fallbackLng: 'en',
    // escapeValue: false — React escapes already. i18next ships a built-in
    // Intl.NumberFormat-backed `number` formatter, so any `{{value, number}}`
    // placeholder already renders বাংলা digits (০১২৩...) in Bengali mode with
    // no extra config here — see utils/localeDate.ts#formatLocaleNumber for
    // the equivalent for raw (non-interpolated) JSX-rendered numbers.
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'bustandeen_lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
