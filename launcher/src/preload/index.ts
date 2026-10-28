import { contextBridge } from 'electron';
import type { AzyronApi } from '../shared/api';

const api: AzyronApi = {
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
};

contextBridge.exposeInMainWorld('azyron', api);
