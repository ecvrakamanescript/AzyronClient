import { useEffect, useState } from 'react';
import { CloseIcon, MaximizeIcon, MinimizeIcon, RestoreIcon } from './Icons';

export default function TitleBar() {
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
          title="Minimieren"
          aria-label="Minimieren"
          onClick={() => window.azyron.window.minimize()}
        >
          <MinimizeIcon />
        </button>
        <button
          type="button"
          className="titlebar__button"
          title={maximized ? 'Wiederherstellen' : 'Maximieren'}
          aria-label={maximized ? 'Wiederherstellen' : 'Maximieren'}
          onClick={() => window.azyron.window.toggleMaximize()}
        >
          {maximized ? <RestoreIcon /> : <MaximizeIcon />}
        </button>
        <button
          type="button"
          className="titlebar__button titlebar__button--close"
          title="Schliessen"
          aria-label="Schliessen"
          onClick={() => window.azyron.window.close()}
        >
          <CloseIcon />
        </button>
      </div>
    </header>
  );
}
