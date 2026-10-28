import { join } from 'node:path';
import { app, BrowserWindow, Menu, shell } from 'electron';

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
    backgroundColor: '#0e0b14',
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Show the window once the first frame is ready, so no white flash appears.
  win.once('ready-to-show', () => win.show());

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

  if (isDev) {
    win.webContents.on('before-input-event', (_event, input) => {
      if (input.type === 'keyDown' && input.key === 'F12') {
        win.webContents.toggleDevTools();
      }
    });
  }

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

// Only one launcher may run at a time; a second start focuses the existing window.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // No default menu bar (File, Edit, ...); the launcher brings its own UI.
  Menu.setApplicationMenu(null);

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  void app.whenReady().then(() => {
    mainWindow = createMainWindow();
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}
