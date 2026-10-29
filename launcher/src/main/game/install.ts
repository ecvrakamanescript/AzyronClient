import { mkdir, readFile, stat, statfs, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { InstallFailure, InstallProgress, InstallState, InstallStateEvent } from '../../shared/install';
import { DownloadError, downloadAll, downloadFile, type DownloadOptions, type DownloadTask } from './download';
import type { ManifestEntry } from './manifest';
import type { GamePaths } from './paths';
import type { RuleEnvironment } from './rules';
import {
  assetIndexPath,
  gameFileTasks,
  isAssetIndex,
  isVersionJson,
  versionFolder,
  versionJsonPath,
  type VersionJson
} from './versionJson';

// Space kept free in addition to the download size.
const DISK_RESERVE_BYTES = 200 * 1024 * 1024;
const PROGRESS_INTERVAL_MS = 150;

export class NotEnoughSpaceError extends Error {
  constructor(
    readonly neededBytes: number,
    readonly freeBytes: number
  ) {
    super(`Not enough disk space: ${Math.ceil(neededBytes / 1e6)} MB needed, ${Math.floor(freeBytes / 1e6)} MB free`);
    this.name = 'NotEnoughSpaceError';
  }
}

export interface InstallDependencies {
  paths: GamePaths;
  env: RuleEnvironment;
  /** Manifest entry of a supported version; throws for anything else. */
  findVersion: (versionId: string) => Promise<ManifestEntry>;
  /** Only for tests: other download servers. */
  downloadOptions?: DownloadOptions;
}

function markerPath(paths: GamePaths, versionId: string): string {
  return join(versionFolder(paths, versionId), 'install.json');
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8'));
}

/** Bytes still to download: files that do not exist yet or have a different size. */
async function missingBytes(tasks: readonly DownloadTask[]): Promise<number> {
  let total = 0;
  for (const task of tasks) {
    const size = await stat(task.path).then(
      (info) => info.size,
      () => -1
    );
    if (size !== task.size) total += task.size ?? 0;
  }
  return total;
}

function classify(error: unknown): InstallFailure {
  if (error instanceof NotEnoughSpaceError) return 'disk-space';
  if (error instanceof DownloadError && error.message.startsWith('HTTP')) return 'network';
  // fetch reports missing connections as "fetch failed" (TypeError), timeouts as TimeoutError.
  if (error instanceof TypeError || (error instanceof Error && error.name === 'TimeoutError')) return 'network';
  return 'other';
}

/**
 * Installs Minecraft versions: version file, client, libraries, logging configuration and assets.
 * One installation per version at a time; every change of state is reported through emit.
 */
export class InstallManager {
  private readonly running = new Map<string, { controller: AbortController; progress: InstallProgress }>();
  private readonly failures = new Map<string, { reason: InstallFailure; detail: string }>();

  constructor(
    private readonly deps: InstallDependencies,
    private readonly emit: (event: InstallStateEvent) => void
  ) {}

  async getState(versionId: string): Promise<InstallState> {
    const running = this.running.get(versionId);
    if (running) return { status: 'installing', progress: { ...running.progress } };
    const failure = this.failures.get(versionId);
    if (failure) return { status: 'failed', ...failure };
    return (await this.isInstalled(versionId)) ? { status: 'installed' } : { status: 'not-installed' };
  }

  /** True once an installation of this version has completed. */
  async isInstalled(versionId: string): Promise<boolean> {
    try {
      const marker = await readJson(markerPath(this.deps.paths, versionId));
      return typeof marker === 'object' && marker !== null && (marker as { versionId?: unknown }).versionId === versionId;
    } catch {
      return false;
    }
  }

  /** Starts the installation in the background; does nothing if it is already running. */
  start(versionId: string): void {
    if (this.running.has(versionId)) return;
    const controller = new AbortController();
    const progress: InstallProgress = { stage: 'metadata', completedBytes: 0, totalBytes: 0, completedFiles: 0, totalFiles: 0 };
    this.running.set(versionId, { controller, progress });
    this.failures.delete(versionId);
    this.emit({ versionId, state: { status: 'installing', progress: { ...progress } } });

    this.install(versionId, controller.signal, progress).then(
      () => this.finish(versionId, { status: 'installed' }),
      (error: unknown) => {
        if (controller.signal.aborted) {
          this.finish(versionId, { status: 'not-installed' });
          return;
        }
        console.error(`Installation of ${versionId} failed:`, error);
        const failure = { reason: classify(error), detail: error instanceof Error ? error.message : String(error) };
        this.failures.set(versionId, failure);
        this.finish(versionId, { status: 'failed', ...failure });
      }
    );
  }

  cancel(versionId: string): void {
    this.running.get(versionId)?.controller.abort(new Error('Installation cancelled'));
  }

  /** Stops all installations, e.g. when the launcher closes. */
  cancelAll(): void {
    for (const versionId of this.running.keys()) this.cancel(versionId);
  }

  private finish(versionId: string, state: InstallState): void {
    this.running.delete(versionId);
    this.emit({ versionId, state });
  }

  private async install(versionId: string, signal: AbortSignal, progress: InstallProgress): Promise<void> {
    const { paths, env } = this.deps;
    const options: DownloadOptions = { ...this.deps.downloadOptions, signal };

    // 1. Version file and asset index (small files that list everything else).
    const entry = await this.deps.findVersion(versionId);
    const jsonPath = versionJsonPath(paths, versionId);
    await downloadFile({ url: entry.url, path: jsonPath, sha1: entry.sha1 }, options);
    const version = await readJson(jsonPath);
    if (!isVersionJson(version)) {
      throw new Error(`Version file of ${versionId} has an unexpected format`);
    }
    const indexPath = assetIndexPath(paths, version);
    await downloadFile({ ...version.assetIndex, path: indexPath }, options);
    const assets = await readJson(indexPath);
    if (!isAssetIndex(assets)) {
      throw new Error(`Asset index ${version.assetIndex.id} has an unexpected format`);
    }

    // 2. Game files.
    const tasks = gameFileTasks(paths, version, assets, env);
    await this.checkDiskSpace(await missingBytes(tasks));
    await this.download(versionId, 'game', tasks, options, progress);

    await this.writeMarker(version);
  }

  /** Downloads one stage and reports its progress, throttled for the IPC channel. */
  protected async download(
    versionId: string,
    stage: InstallProgress['stage'],
    tasks: readonly DownloadTask[],
    options: DownloadOptions,
    progress: InstallProgress
  ): Promise<void> {
    progress.stage = stage;
    let lastReport = 0;
    await downloadAll(tasks, {
      ...options,
      concurrency: 16,
      onProgress: (batch) => {
        Object.assign(progress, batch);
        const now = Date.now();
        if (now - lastReport >= PROGRESS_INTERVAL_MS || batch.completedFiles === batch.totalFiles) {
          lastReport = now;
          this.emit({ versionId, state: { status: 'installing', progress: { ...progress } } });
        }
      }
    });
  }

  protected async checkDiskSpace(neededBytes: number): Promise<void> {
    await mkdir(this.deps.paths.root, { recursive: true });
    const info = await statfs(this.deps.paths.root);
    const freeBytes = info.bavail * info.bsize;
    if (neededBytes + DISK_RESERVE_BYTES > freeBytes) {
      throw new NotEnoughSpaceError(neededBytes + DISK_RESERVE_BYTES, freeBytes);
    }
  }

  private async writeMarker(version: VersionJson): Promise<void> {
    const marker = { versionId: version.id, completedAt: new Date().toISOString() };
    await writeFile(markerPath(this.deps.paths, version.id), `${JSON.stringify(marker, null, 2)}\n`, 'utf8');
  }
}
