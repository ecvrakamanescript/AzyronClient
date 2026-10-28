import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { defaultSettings } from '../../shared/settings';
import App from './App';
import { applyTheme } from './theme';
import './styles/theme.css';
import './styles/app.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Element #root is missing in index.html');
}
const root = createRoot(rootElement);

// The theme is set before the first render. The window only appears once content
// is drawn (ready-to-show), so the wrong theme never flashes.
void window.azyron.settings
  .get()
  .catch(() => defaultSettings)
  .then((settings) => {
    applyTheme(settings.theme);
    root.render(
      <StrictMode>
        <App initialSettings={settings} />
      </StrictMode>
    );
  });
