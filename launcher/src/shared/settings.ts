import { defaultLanguageId, isLanguageId, type LanguageId } from './languages';
import { defaultThemeId, isThemeId, type ThemeId } from './themes';

/** Launcher settings, stored by the main process as settings.json in the userData folder. */
export interface Settings {
  /** Format version of the file, so later phases can migrate old files. */
  readonly version: 1;
  readonly theme: ThemeId;
  readonly language: LanguageId;
}

/** Fields the renderer may change; everything else is managed by the main process. */
export type SettingsChange = Partial<Omit<Settings, 'version'>>;

export const defaultSettings: Settings = {
  version: 1,
  theme: defaultThemeId,
  language: defaultLanguageId
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Turns any parsed JSON into valid settings. Missing or invalid fields fall back
 * to their default, so a damaged file never stops the launcher from starting.
 * Files from before a field existed (e.g. without language) get its default.
 */
export function normalizeSettings(raw: unknown): Settings {
  const source = isObject(raw) ? raw : {};
  return {
    version: 1,
    theme: isThemeId(source['theme']) ? source['theme'] : defaultSettings.theme,
    language: isLanguageId(source['language']) ? source['language'] : defaultSettings.language
  };
}

/**
 * Checks a change requested by the renderer. Returns null if any field is invalid,
 * so a wrong value is rejected instead of being saved.
 */
export function validateSettingsChange(raw: unknown): SettingsChange | null {
  if (!isObject(raw)) {
    return null;
  }
  const change: { theme?: ThemeId; language?: LanguageId } = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === 'theme' && isThemeId(value)) {
      change.theme = value;
    } else if (key === 'language' && isLanguageId(value)) {
      change.language = value;
    } else {
      return null;
    }
  }
  return change;
}
