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
  windowMaximizedChanged: 'window:maximized-changed',
  settingsGet: 'settings:get',
  settingsSet: 'settings:set',
  versionsList: 'versions:list',
  instancesList: 'instances:list',
  instancesCreate: 'instances:create',
  instancesRename: 'instances:rename',
  instancesRemove: 'instances:remove',
  instancesOpenFolder: 'instances:open-folder',
  installGetStates: 'install:get-states',
  installStart: 'install:start',
  installCancel: 'install:cancel',
  installStateChanged: 'install:state-changed',
  launchCheck: 'launch:check',
  skinsDefault: 'skins:default'
} as const;
