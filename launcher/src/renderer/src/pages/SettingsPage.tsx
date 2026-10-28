import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Settings, SettingsChange } from '../../../shared/settings';
import { themeIds } from '../../../shared/themes';
import { languageEntries } from '../i18n';

interface SettingsPageProps {
  title: string;
  settings: Settings;
  onChange: (change: SettingsChange) => void;
}

// A mouse click on a label would focus its radio button, which then shows a focus ring
// on the next key press; select the option directly instead. Keyboard input (arrow keys,
// space) arrives with detail 0 and keeps the native behaviour.
function selectOnMouseClick(select: () => void) {
  return (event: MouseEvent<HTMLLabelElement>) => {
    if (event.detail > 0) {
      event.preventDefault();
      select();
    }
  };
}

// As in the sidebar: mouse clicks do not move the focus, so no focus ring remains; Tab still works.
function keepFocus(event: MouseEvent) {
  event.preventDefault();
}

export default function SettingsPage({ title, settings, onChange }: SettingsPageProps) {
  const { t } = useTranslation();

  return (
    <section className="page">
      <h1 className="page__title">{title}</h1>

      {/* Native radio buttons: arrow keys and screen readers work without extra code. */}
      <fieldset className="settings__group">
        <legend className="settings__heading">{t('settings.themeHeading')}</legend>
        <p className="settings__hint">{t('settings.themeHint')}</p>

        <div className="theme-picker" onMouseDown={keepFocus}>
          {themeIds.map((id) => (
            <label key={id} className="theme-option" onClick={selectOnMouseClick(() => onChange({ theme: id }))}>
              <input
                type="radio"
                name="theme"
                value={id}
                className="theme-option__input"
                checked={id === settings.theme}
                onChange={() => onChange({ theme: id })}
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
              <span className="theme-option__label">{t(`themes.${id}.label`)}</span>
              <span className="theme-option__description">{t(`themes.${id}.description`)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="settings__group">
        <legend className="settings__heading">{t('settings.languageHeading')}</legend>
        <p className="settings__hint">{t('settings.languageHint')}</p>

        <div className="language-picker" onMouseDown={keepFocus}>
          {languageEntries.map(({ id, label }) => (
            <label
              key={id}
              className="language-option"
              onClick={selectOnMouseClick(() => onChange({ language: id }))}
            >
              <input
                type="radio"
                name="language"
                value={id}
                className="language-option__input"
                checked={id === settings.language}
                onChange={() => onChange({ language: id })}
              />
              {/* lang lets screen readers pronounce each name in its own language. */}
              <span className="language-option__label" lang={id}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
