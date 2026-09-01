import i18n from '../i18n.js';

/**
 * Locale-aware date formatting so month/weekday names follow the app's
 * selected language while numerals stay Latin (the app's numeral convention
 * everywhere else, even in বাংলা). Use in place of `date.toLocaleDateString('en-US', ...)`.
 */
const INTL_LOCALE: Record<string, string> = {
  en: 'en-US',
  bn: 'bn-u-nu-latn',
};

export function formatLocaleDate(date: Date, options: Intl.DateTimeFormatOptions): string {
  const lang = (i18n.language || 'en').split('-')[0]!;
  return date.toLocaleDateString(INTL_LOCALE[lang] ?? 'en-US', options);
}
