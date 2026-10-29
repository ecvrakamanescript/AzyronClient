import { join } from 'node:path';
import { app, BrowserWindow, Menu, shell } from 'electron';
import { themeBackgrounds } from '../shared/themes';
import { GameContext, registerGameHandlers } from './game/ipc';
import { createGamePaths } from './game/paths';
import { getSettings, loadSettings, registerSettingsHandlers } from './settings';
import { forwardMaximizedState, registerIpcHandlers } from './window-controls';

// Not packaged means started from source (npm run dev / npm start).
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 760,
    minWidth: 1024,
    minHeight: 640,
    title: 'Azyron Client',
    // Same colour as the stored theme, so nothing flashes before the UI is drawn.
    backgroundColor: themeBackgrounds[getSettings().theme],
    // No Windows title bar: the launcher draws its own (TitleBar.tsx).
    // Resizing at the edges and Aero Snap keep working.
    frame: false,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Show the window once the first frame is ready, so no white flash appears.
  win.once('ready-to-show', () => win.show());

  forwardMaximizedState(win);

  // The launcher never opens additional windows; https links open in the default browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // The UI must never navigate away from the launcher pages.
  win.webContents.on('will-navigate', (event) => {
    if (event.url !== win.webContents.getURL()) {
      event.preventDefault();
    }
  });

  // In dev mode electron-vite serves the UI with hot reload; otherwise load the built files.
  const rendererUrl = process.env['ELECTRON_RENDERER_URL'];
  if (isDev && rendererUrl) {
    void win.loadURL(rendererUrl);
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  win.on('closed', () => {
    mainWindow = null;
  });

  return win;
}

// Without a menu there is no menu bar (File, Edit, ...); the launcher brings its own UI.
// In dev mode a hidden menu provides shortcuts that work in the whole window,
// including docked DevTools (keys pressed there never reach the page).
function createAppMenu(): Menu | null {
  if (!isDev) {
    return null;
  }
  return Menu.buildFromTemplate([
    {
      label: 'Development',
      submenu: [{ role: 'toggleDevTools', accelerator: 'F12' }, { role: 'reload' }]
    }
  ]);
}

// Only one launcher may run at a time; a second start focuses the existing window.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  Menu.setApplicationMenu(createAppMenu());

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  void app.whenReady().then(() => {
    // Settings are needed before the window exists (background colour of the theme).
    loadSettings();
    registerIpcHandlers();
    registerSettingsHandlers((settings) => {
      mainWindow?.setBackgroundColor(themeBackgrounds[settings.theme]);
    });
    // Game data lives next to settings.json: %APPDATA%\Azyron Client\game
    registerGameHandlers(new GameContext(createGamePaths(join(app.getPath('userData'), 'game'))));
    mainWindow = createMainWindow();
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
