import { ipcMain } from 'electron';
import { IpcChannels } from '../../shared/ipc';
import { loadManifest, toVersionList, type VersionManifest } from './manifest';
import type { GamePaths } from './paths';

// The manifest is loaded again at most every ten minutes.
const MANIFEST_MAX_AGE_MS = 10 * 60 * 1000;

/** Game data shared by the IPC handlers: folders and the loaded version manifest. */
export class GameContext {
  private manifest: { data: VersionManifest; offline: boolean; loadedAt: number } | null = null;
  private loading: Promise<{ manifest: VersionManifest; offline: boolean }> | null = null;

  constructor(readonly paths: GamePaths) {}

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
}

/** Registers the IPC handlers behind window.azyron.gameVersions and the other game functions. */
export function registerGameHandlers(context: GameContext): void {
  ipcMain.handle(IpcChannels.versionsList, async (_event, includeSnapshots: unknown) => {
    const { manifest, offline } = await context.getManifest();
    return toVersionList(manifest, offline, includeSnapshots === true);
  });
}
