import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon, MaximizeIcon, MinimizeIcon, RestoreIcon } from './Icons';

export default function TitleBar() {
  const { t } = useTranslation();
  const [maximized, setMaximized] = useState(false);

  // Read the current state once, then follow every change reported by the main process.
  useEffect(() => {
    let active = true;
    void window.azyron.window.isMaximized().then((value) => {
      if (active) {
        setMaximized(value);
      }
    });
    const unsubscribe = window.azyron.window.onMaximizedChange(setMaximized);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <header className="titlebar">
      <div className="titlebar__brand">
        <span className="titlebar__logo" aria-hidden="true">
          A
        </span>
        <span className="titlebar__name">Azyron Client</span>
      </div>

      {/* Mouse clicks do not move the focus here (like native Windows buttons); Tab still works. */}
      <div className="titlebar__controls" onMouseDown={(event) => event.preventDefault()}>
        <button
          type="button"
          className="titlebar__button"
          title={t('titleBar.minimize')}
          aria-label={t('titleBar.minimize')}
          onClick={() => window.azyron.window.minimize()}
        >
          <MinimizeIcon />
        </button>
        <button
          type="button"
          className="titlebar__button"
          title={maximized ? t('titleBar.restore') : t('titleBar.maximize')}
          aria-label={maximized ? t('titleBar.restore') : t('titleBar.maximize')}
          onClick={() => window.azyron.window.toggleMaximize()}
        >
          {maximized ? <RestoreIcon /> : <MaximizeIcon />}
        </button>
        <button
          type="button"
          className="titlebar__button titlebar__button--close"
          title={t('titleBar.close')}
          aria-label={t('titleBar.close')}
          onClick={() => window.azyron.window.close()}
        >
          <CloseIcon />
        </button>
      </div>
    </header>
  );
}
