import { ipcMain, shell } from 'electron';
import { IpcChannels } from '../../shared/ipc';
import { InstanceStore } from './instances';
import { loadManifest, supportedVersions, toVersionList, type VersionManifest } from './manifest';
import type { GamePaths } from './paths';

// The manifest is loaded again at most every ten minutes.
const MANIFEST_MAX_AGE_MS = 10 * 60 * 1000;

/** Game data shared by the IPC handlers: folders, the loaded version manifest and the instances. */
export class GameContext {
  private manifest: { data: VersionManifest; offline: boolean; loadedAt: number } | null = null;
  private loading: Promise<{ manifest: VersionManifest; offline: boolean }> | null = null;
  readonly instances: InstanceStore;

  constructor(readonly paths: GamePaths) {
    this.instances = new InstanceStore(paths);
  }

  /** Returns the manifest, loading it only if it is missing, too old or was only the offline copy. */
  async getManifest(): Promise<{ manifest: VersionManifest; offline: boolean }> {
    const cached = this.manifest;
    if (cached && !cached.offline && Date.now() - cached.loadedAt < MANIFEST_MAX_AGE_MS) {
      return { manifest: cached.data, offline: false };
    }
    // Several requests at the same time share one download.
    this.loading ??= loadManifest(this.paths).finally(() => {
      this.loading = null;
    });
    const result = await this.loading;
    this.manifest = { data: result.manifest, offline: result.offline, loadedAt: Date.now() };
    return result;
  }

  /** The manifest entry of a supported version, or an error for anything else. */
  async findSupportedVersion(versionId: unknown) {
    const { manifest } = await this.getManifest();
    const entry = supportedVersions(manifest).find((version) => version.id === versionId);
    if (!entry) {
      throw new Error('Unsupported version');
    }
    return entry;
  }
}

/** Registers the IPC handlers behind window.azyron.gameVersions and window.azyron.instances. */
export function registerGameHandlers(context: GameContext): void {
  ipcMain.handle(IpcChannels.versionsList, async (_event, includeSnapshots: unknown) => {
    const { manifest, offline } = await context.getManifest();
    return toVersionList(manifest, offline, includeSnapshots === true);
  });

  ipcMain.handle(IpcChannels.instancesList, () => context.instances.list());

  ipcMain.handle(IpcChannels.instancesCreate, async (_event, name: unknown, versionId: unknown) => {
    const version = await context.findSupportedVersion(versionId);
    return context.instances.create(name, version.id);
  });

  ipcMain.handle(IpcChannels.instancesRename, (_event, id: unknown, name: unknown) =>
    context.instances.rename(String(id), name)
  );

  ipcMain.handle(IpcChannels.instancesRemove, (_event, id: unknown) => context.instances.remove(String(id)));

  ipcMain.handle(IpcChannels.instancesOpenFolder, async (_event, id: unknown) => {
    const instance = await context.instances.get(String(id));
    if (!instance) {
      throw new Error('Instance not found');
    }
    // openPath returns an error text instead of throwing.
    const error = await shell.openPath(context.instances.folder(instance.id));
    if (error) {
      throw new Error(error);
    }
  });
}
