import type { ThemeId } from '../../shared/themes';

/** Activates a theme: theme.css switches all colour variables via this attribute. */
export function applyTheme(id: ThemeId): void {
  document.documentElement.dataset['theme'] = id;
}
