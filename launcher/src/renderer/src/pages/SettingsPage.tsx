import type { ThemeId } from '../../../shared/themes';
import { themeEntries } from '../theme';

interface SettingsPageProps {
  title: string;
  theme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
}

export default function SettingsPage({ title, theme, onThemeChange }: SettingsPageProps) {
  return (
    <section className="page">
      <h1 className="page__title">{title}</h1>

      {/* Native radio buttons: arrow keys and screen readers work without extra code. */}
      <fieldset className="settings__group">
        <legend className="settings__heading">Theme</legend>
        <p className="settings__hint">The selected theme is applied and saved immediately.</p>

        {/* As in the sidebar: mouse clicks do not move the focus, so no focus ring remains; Tab still works. */}
        <div className="theme-picker" onMouseDown={(event) => event.preventDefault()}>
          {themeEntries.map(({ id, label, description }) => (
            <label
              key={id}
              className="theme-option"
              onClick={(event) => {
                // A mouse click on a label would focus the radio button; select the theme directly instead.
                // Keyboard input (arrow keys, space) arrives with detail 0 and keeps the native behaviour.
                if (event.detail > 0) {
                  event.preventDefault();
                  onThemeChange(id);
                }
              }}
            >
              <input
                type="radio"
                name="theme"
                value={id}
                className="theme-option__input"
                checked={id === theme}
                onChange={() => onThemeChange(id)}
              />
              {/* The preview carries its own data-theme, so it shows that theme's colours from theme.css. */}
              <span className="theme-preview" data-theme={id} aria-hidden="true">
                <span className="theme-preview__titlebar" />
                <span className="theme-preview__body">
                  <span className="theme-preview__sidebar">
                    <span className="theme-preview__item" />
                  </span>
                  <span className="theme-preview__content">
                    <span className="theme-preview__line theme-preview__line--title" />
                    <span className="theme-preview__line" />
                    <span className="theme-preview__line theme-preview__line--short" />
                    <span className="theme-preview__button" />
                  </span>
                </span>
              </span>
              <span className="theme-option__label">{label}</span>
              <span className="theme-option__description">{description}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
