import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { LanguageId } from '../../shared/languages';
import de from './locales/de';
import en, { type Translation } from './locales/en';

// Makes t() check its keys against en.ts: a key that does not exist is a type error.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: Translation };
  }
}

export interface LanguageEntry {
  id: LanguageId;
  /** Name of the language in that language itself, so it can be found in any UI language. */
  label: string;
}

// Order of the options on the settings page.
export const languageEntries: readonly LanguageEntry[] = [
  { id: 'en', label: 'English' },
  { id: 'de', label: 'Deutsch' }
];

/**
 * Sets up i18next with the stored language. Call once before the first render.
 * All texts are bundled with the launcher, so nothing is loaded from the network.
 */
export async function initI18n(language: LanguageId): Promise<void> {
  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      de: { translation: de }
    },
    lng: language,
    fallbackLng: 'en',
    // React escapes all text itself.
    interpolation: { escapeValue: false }
  });
  document.documentElement.lang = language;
}

/** Switches the UI language; every component using useTranslation() renders again. */
export function applyLanguage(language: LanguageId): void {
  if (i18n.language !== language) {
    void i18n.changeLanguage(language);
  }
  document.documentElement.lang = language;
}
