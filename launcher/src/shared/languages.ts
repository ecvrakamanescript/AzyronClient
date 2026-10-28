/**
 * UI languages. The texts themselves live in src/renderer/src/locales;
 * English is the source of all texts, German is a translation.
 */
export const languageIds = ['en', 'de'] as const;

export type LanguageId = (typeof languageIds)[number];

export const defaultLanguageId: LanguageId = 'en';

export function isLanguageId(value: unknown): value is LanguageId {
  return typeof value === 'string' && (languageIds as readonly string[]).includes(value);
}
