/**
 * Names of the IPC channels between main process and preload script.
 * Both sides import these constants, so a typo cannot break the connection unnoticed.
 */
export const IpcChannels = {
  appGetVersion: 'app:get-version',
  windowMinimize: 'window:minimize',
  windowToggleMaximize: 'window:toggle-maximize',
  windowClose: 'window:close',
  windowIsMaximized: 'window:is-maximized',
  windowMaximizedChanged: 'window:maximized-changed'
} as const;
