import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import type { AzyronApi } from '../shared/api';
import { IpcChannels } from '../shared/ipc';

// ipcRenderer itself is never handed to the renderer; only these fixed functions are.
const api: AzyronApi = {
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  },
  app: {
    getVersion: () => ipcRenderer.invoke(IpcChannels.appGetVersion)
  },
  window: {
    minimize: () => ipcRenderer.send(IpcChannels.windowMinimize),
    toggleMaximize: () => ipcRenderer.send(IpcChannels.windowToggleMaximize),
    close: () => ipcRenderer.send(IpcChannels.windowClose),
    isMaximized: () => ipcRenderer.invoke(IpcChannels.windowIsMaximized),
    onMaximizedChange: (listener) => {
      const handler = (_event: IpcRendererEvent, maximized: boolean) => listener(maximized);
      ipcRenderer.on(IpcChannels.windowMaximizedChanged, handler);
      return () => {
        ipcRenderer.removeListener(IpcChannels.windowMaximizedChanged, handler);
      };
    }
  },
  settings: {
    get: () => ipcRenderer.invoke(IpcChannels.settingsGet),
    set: (change) => ipcRenderer.invoke(IpcChannels.settingsSet, change)
  },
  gameVersions: {
    list: (includeSnapshots) => ipcRenderer.invoke(IpcChannels.versionsList, includeSnapshots)
  }
};

contextBridge.exposeInMainWorld('azyron', api);
