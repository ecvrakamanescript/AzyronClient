import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Settings, SettingsChange } from '../../shared/settings';
import Sidebar from './components/Sidebar';
import TitleBar from './components/TitleBar';
import { applyLanguage } from './i18n';
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
  const { t } = useTranslation();
  // The launcher has no URLs; the visible page is plain React state.
  const [currentId, setCurrentId] = useState<PageId>('home');
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const current = pages.find((page) => page.id === currentId) ?? pages[0];
  const title = t(`nav.${current.id}`);

  const showSettings = (next: Settings) => {
    applyTheme(next.theme);
    applyLanguage(next.language);
    setSettings(next);
  };

  // A change is shown at once; the saved state from the main process then has the last word.
  const changeSettings = (change: SettingsChange) => {
    showSettings({ ...settings, ...change });
    window.azyron.settings.set(change).then(showSettings, () => {
      // Rejected by the main process: go back to what it has stored.
      void window.azyron.settings.get().then(showSettings);
    });
  };

  const renderPage = () => {
    switch (current.id) {
      case 'settings':
        return <SettingsPage title={title} settings={settings} onChange={changeSettings} />;
      case 'about':
        return <AboutPage title={title} />;
      default:
        return <PlaceholderPage title={title} />;
    }
  };

  return (
    <div className="app">
      <TitleBar />
      <div className="app__body">
        <Sidebar current={current.id} onSelect={setCurrentId} />
        {/* key: every page change mounts a fresh content area, so the page fades in and starts at the top. */}
        <main key={current.id} className="app__content">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
