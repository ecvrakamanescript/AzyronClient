import type { ThemeId } from '../../shared/themes';

export interface ThemeEntry {
  id: ThemeId;
  /** Fixed English texts for now; become translation keys in step 1.4. */
  label: string;
  description: string;
}

// Order of the options on the settings page.
export const themeEntries: readonly ThemeEntry[] = [
  { id: 'dark', label: 'Dark', description: 'Dark theme with violet accent (default)' },
  { id: 'light', label: 'Light', description: 'Light surfaces with dark text' },
  { id: 'amoled', label: 'AMOLED Black', description: 'Pure black background for OLED screens' }
];

/** Activates a theme: theme.css switches all colour variables via this attribute. */
export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset['theme'] = id;
}
