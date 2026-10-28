import { useState } from 'react';
import type { Settings } from '../../shared/settings';
import type { ThemeId } from '../../shared/themes';
import Sidebar from './components/Sidebar';
import TitleBar from './components/TitleBar';
import { pages, type PageId } from './navigation';
import AboutPage from './pages/AboutPage';
import PlaceholderPage from './pages/PlaceholderPage';
import SettingsPage from './pages/SettingsPage';
import { applyTheme } from './theme';

interface AppProps {
  /** Settings loaded before the first render (main.tsx). */
  initialSettings: Settings;
}

export default function App({ initialSettings }: AppProps) {
  // The launcher has no URLs; the visible page is plain React state.
  const [currentId, setCurrentId] = useState<PageId>('home');
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const current = pages.find((page) => page.id === currentId) ?? pages[0];

  // The new theme is shown at once; the saved state from the main process then has the last word.
  const changeTheme = (theme: ThemeId) => {
    applyTheme(theme);
    setSettings((previous) => ({ ...previous, theme }));
    window.azyron.settings.set({ theme }).then(
      (saved) => {
        applyTheme(saved.theme);
        setSettings(saved);
      },
      () => {
        // Rejected by the main process: go back to what it has stored.
        void window.azyron.settings.get().then((stored) => {
          applyTheme(stored.theme);
          setSettings(stored);
        });
      }
    );
  };

  const renderPage = () => {
    switch (current.id) {
      case 'settings':
        return <SettingsPage title={current.label} theme={settings.theme} onThemeChange={changeTheme} />;
      case 'about':
        return <AboutPage title={current.label} />;
      default:
        return <PlaceholderPage title={current.label} />;
    }
  };

  return (
    <div className="app">
      <TitleBar />
      <div className="app__body">
        <Sidebar current={current.id} onSelect={setCurrentId} />
        <main className="app__content">{renderPage()}</main>
      </div>
    </div>
  );
}
