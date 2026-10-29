import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { OLDEST_SUPPORTED_VERSION, type VersionList, type VersionSummary } from '../../shared/versions';
import { isMojangUrl } from './download';
import type { GamePaths } from './paths';

export const VERSION_MANIFEST_URL = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';

/** One entry of Mojang's version manifest. */
export interface ManifestEntry {
  id: string;
  type: string;
  url: string;
  sha1: string;
  releaseTime: string;
}

export interface VersionManifest {
  latest: { release: string; snapshot: string };
  versions: ManifestEntry[];
}

export interface FetchOptions {
  isAllowedUrl?: (url: string) => boolean;
  timeoutMs?: number;
}

/** Loads JSON from an allowed server. */
export async function fetchJson(url: string, options: FetchOptions = {}): Promise<unknown> {
  if (!(options.isAllowedUrl ?? isMojangUrl)(url)) {
    throw new Error(`URL is not on the list of allowed download servers: ${url}`);
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(options.timeoutMs ?? 15_000), redirect: 'error' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

function isManifest(value: unknown): value is VersionManifest {
  if (typeof value !== 'object' || value === null) return false;
  const { latest, versions } = value as Partial<VersionManifest>;
  return (
    typeof latest?.release === 'string' &&
    Array.isArray(versions) &&
    versions.every(
      (entry) =>
        typeof entry?.id === 'string' &&
        typeof entry.type === 'string' &&
        typeof entry.url === 'string' &&
        typeof entry.sha1 === 'string' &&
        typeof entry.releaseTime === 'string'
    )
  );
}

function cachePath(paths: GamePaths): string {
  return join(paths.versions, 'version_manifest_v2.json');
}

/**
 * Loads the version manifest from Mojang and keeps a copy on disk.
 * Without a connection the saved copy is used, so the launcher also works offline.
 */
export async function loadManifest(
  paths: GamePaths,
  options: FetchOptions & { url?: string } = {}
): Promise<{ manifest: VersionManifest; offline: boolean }> {
  const file = cachePath(paths);
  try {
    const data = await fetchJson(options.url ?? VERSION_MANIFEST_URL, options);
    if (!isManifest(data)) {
      throw new Error('Version manifest has an unexpected format');
    }
    await mkdir(paths.versions, { recursive: true });
    await writeFile(`${file}.tmp`, JSON.stringify(data), 'utf8');
    await rename(`${file}.tmp`, file);
    return { manifest: data, offline: false };
  } catch (error) {
    let cached: unknown;
    try {
      cached = JSON.parse(await readFile(file, 'utf8'));
    } catch {
      // No usable copy either: report the original problem.
      throw error;
    }
    if (!isManifest(cached)) {
      throw error;
    }
    console.warn('Version manifest could not be loaded, using the saved copy:', error);
    return { manifest: cached, offline: true };
  }
}

/** Releases and snapshots from the oldest supported version on, newest first. */
export function supportedVersions(manifest: VersionManifest): ManifestEntry[] {
  const oldest = manifest.versions.find((entry) => entry.id === OLDEST_SUPPORTED_VERSION);
  if (!oldest) {
    return [];
  }
  const since = Date.parse(oldest.releaseTime);
  return manifest.versions
    .filter((entry) => (entry.type === 'release' || entry.type === 'snapshot') && Date.parse(entry.releaseTime) >= since)
    .sort((a, b) => Date.parse(b.releaseTime) - Date.parse(a.releaseTime));
}

export function toVersionList(manifest: VersionManifest, offline: boolean, includeSnapshots: boolean): VersionList {
  const supported = supportedVersions(manifest);
  const versions: VersionSummary[] = supported
    .filter((entry) => includeSnapshots || entry.type === 'release')
    .map((entry) => ({ id: entry.id, type: entry.type as VersionSummary['type'], releaseTime: entry.releaseTime }));
  const isSupported = (id: string) => supported.some((entry) => entry.id === id);
  return {
    latestRelease: isSupported(manifest.latest.release) ? manifest.latest.release : null,
    latestSnapshot: isSupported(manifest.latest.snapshot) ? manifest.latest.snapshot : null,
    versions,
    offline
  };
}
