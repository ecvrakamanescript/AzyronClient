import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { defaultSettings } from '../../shared/settings';
import App from './App';
import { initI18n } from './i18n';
import { applyTheme } from './theme';
import './styles/theme.css';
import './styles/app.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Element #root is missing in index.html');
}
const root = createRoot(rootElement);

// Theme and language are set before the first render. The window only appears once content
// is drawn (ready-to-show), so the wrong theme or language never flashes.
void window.azyron.settings
  .get()
  .catch(() => defaultSettings)
  .then(async (settings) => {
    applyTheme(settings.theme);
    await initI18n(settings.language);
    root.render(
      <StrictMode>
        <App initialSettings={settings} />
      </StrictMode>
    );
  });
