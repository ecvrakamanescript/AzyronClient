/**
 * Built-in themes. The colours themselves live in src/renderer/src/styles/theme.css;
 * here are only the IDs and the background colour the main process needs for the window.
 */
export const themeIds = ['dark', 'light', 'amoled'] as const;

export type ThemeId = (typeof themeIds)[number];

export const defaultThemeId: ThemeId = 'dark';

/** Must match --color-bg of the same theme in theme.css. */
export const themeBackgrounds: Readonly<Record<ThemeId, string>> = {
  dark: '#0e0b14',
  light: '#f5f3fa',
  amoled: '#000000'
};

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (themeIds as readonly string[]).includes(value);
}
