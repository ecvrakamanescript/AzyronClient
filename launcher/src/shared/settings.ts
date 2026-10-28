import { defaultThemeId, isThemeId, type ThemeId } from './themes';

/** Launcher settings, stored by the main process as settings.json in the userData folder. */
export interface Settings {
  /** Format version of the file, so later phases can migrate old files. */
  readonly version: 1;
  readonly theme: ThemeId;
}

/** Fields the renderer may change; everything else is managed by the main process. */
export type SettingsChange = Partial<Omit<Settings, 'version'>>;

export const defaultSettings: Settings = {
  version: 1,
  theme: defaultThemeId
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Turns any parsed JSON into valid settings. Missing or invalid fields fall back
 * to their default, so a damaged file never stops the launcher from starting.
 */
export function normalizeSettings(raw: unknown): Settings {
  const source = isObject(raw) ? raw : {};
  return {
    version: 1,
    theme: isThemeId(source['theme']) ? source['theme'] : defaultSettings.theme
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
  const change: { theme?: ThemeId } = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === 'theme' && isThemeId(value)) {
      change.theme = value;
    } else {
      return null;
    }
  }
  return change;
}
