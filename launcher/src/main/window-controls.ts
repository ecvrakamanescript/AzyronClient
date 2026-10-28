import { app, BrowserWindow, ipcMain, type IpcMainEvent, type IpcMainInvokeEvent } from 'electron';
import { IpcChannels } from '../shared/ipc';

// A message may only control the window it was sent from.
function senderWindow(event: IpcMainEvent | IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender);
}

/** Registers the IPC handlers behind window.azyron.app and window.azyron.window. Call once at startup. */
export function registerIpcHandlers(): void {
  ipcMain.handle(IpcChannels.appGetVersion, () => app.getVersion());

  ipcMain.on(IpcChannels.windowMinimize, (event) => {
    senderWindow(event)?.minimize();
  });

  ipcMain.on(IpcChannels.windowToggleMaximize, (event) => {
    const win = senderWindow(event);
    if (!win) {
      return;
    }
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  });

  ipcMain.on(IpcChannels.windowClose, (event) => {
    senderWindow(event)?.close();
  });

  ipcMain.handle(IpcChannels.windowIsMaximized, (event) => senderWindow(event)?.isMaximized() ?? false);
}

/**
 * Tells the UI when the window is maximized or restored, also when this happens
 * without the title bar buttons (double-click on the title bar, Win+Arrow keys).
 */
export function forwardMaximizedState(win: BrowserWindow): void {
  const send = () => win.webContents.send(IpcChannels.windowMaximizedChanged, win.isMaximized());
  win.on('maximize', send);
  win.on('unmaximize', send);
}
