import { join } from 'node:path';
import type { DownloadTask } from './download';
import type { GamePaths } from './paths';
import { rulesAllow, type Rule, type RuleEnvironment, type WindowsArch } from './rules';

/** A file in Mojang's metadata. */
export interface RemoteFile {
  url: string;
  sha1: string;
  size: number;
}

export interface Library {
  /** Maven coordinates group:artifact:version[:classifier]. */
  name: string;
  downloads?: { artifact?: RemoteFile & { path: string } };
  rules?: Rule[];
  /** Only in old versions (before 1.19); not supported in this phase. */
  natives?: Record<string, string>;
}

/** An argument: plain text, or values that apply only if their rules allow it. */
export type Argument = string | { rules: Rule[]; value: string | string[] };

/** The parts of a version file (versions/<id>/<id>.json) the launcher uses. */
export interface VersionJson {
  id: string;
  type: string;
  mainClass: string;
  arguments: { game: Argument[]; jvm: Argument[] };
  assetIndex: RemoteFile & { id: string; totalSize: number };
  assets: string;
  downloads: { client: RemoteFile };
  libraries: Library[];
  javaVersion: { component: string; majorVersion: number };
  logging?: { client?: { argument: string; file: RemoteFile & { id: string } } };
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isRemoteFile = (value: unknown): value is RemoteFile =>
  isObject(value) && typeof value['url'] === 'string' && typeof value['sha1'] === 'string' && typeof value['size'] === 'number';

/** Checks the fields the launcher relies on; versions before 1.13 (no "arguments") are rejected. */
export function isVersionJson(value: unknown): value is VersionJson {
  if (!isObject(value)) return false;
  const args = value['arguments'];
  const java = value['javaVersion'];
  const downloads = value['downloads'];
  return (
    typeof value['id'] === 'string' &&
    typeof value['mainClass'] === 'string' &&
    isObject(args) &&
    Array.isArray(args['game']) &&
    Array.isArray(args['jvm']) &&
    isRemoteFile(value['assetIndex']) &&
    isObject(downloads) &&
    isRemoteFile(downloads['client']) &&
    Array.isArray(value['libraries']) &&
    isObject(java) &&
    typeof java['component'] === 'string'
  );
}

/** Native libraries are marked by their classifier; the rules only say "windows", not which processor. */
export function nativeClassifier(arch: WindowsArch): string {
  return { x64: 'natives-windows', arm64: 'natives-windows-arm64', x86: 'natives-windows-x86' }[arch];
}

/** Libraries for this computer, in the order of the version file (that is also the classpath order). */
export function selectLibraries(version: VersionJson, env: RuleEnvironment): (Library & { downloads: { artifact: RemoteFile & { path: string } } })[] {
  const selected = [];
  for (const library of version.libraries) {
    if (library.natives) {
      throw new Error(`Version ${version.id} uses the old natives format, which is not supported yet`);
    }
    if (!rulesAllow(library.rules, env)) continue;
    const classifier = library.name.split(':')[3];
    if (classifier?.startsWith('natives-') && classifier !== nativeClassifier(env.arch)) continue;
    const artifact = library.downloads?.artifact;
    if (!artifact) continue;
    selected.push({ ...library, downloads: { artifact } });
  }
  return selected;
}

export function versionFolder(paths: GamePaths, versionId: string): string {
  return join(paths.versions, versionId);
}

export function versionJsonPath(paths: GamePaths, versionId: string): string {
  return join(versionFolder(paths, versionId), `${versionId}.json`);
}

export function clientJarPath(paths: GamePaths, versionId: string): string {
  return join(versionFolder(paths, versionId), `${versionId}.jar`);
}

export function libraryPath(paths: GamePaths, artifactPath: string): string {
  return join(paths.libraries, ...artifactPath.split('/'));
}

export function assetIndexPath(paths: GamePaths, version: VersionJson): string {
  return join(paths.assets, 'indexes', `${version.assetIndex.id}.json`);
}

export function loggingConfigPath(paths: GamePaths, fileId: string): string {
  return join(paths.assets, 'log_configs', fileId);
}

/** Content of an asset index: every game resource by name, stored under its hash. */
export interface AssetIndex {
  objects: Record<string, { hash: string; size: number }>;
}

export function isAssetIndex(value: unknown): value is AssetIndex {
  return isObject(value) && isObject(value['objects']);
}

const ASSET_SERVER = 'https://resources.download.minecraft.net';

/** All files a version needs (except the version file and asset index themselves). */
export function gameFileTasks(paths: GamePaths, version: VersionJson, assets: AssetIndex, env: RuleEnvironment): DownloadTask[] {
  const tasks: DownloadTask[] = [{ ...version.downloads.client, path: clientJarPath(paths, version.id) }];
  for (const library of selectLibraries(version, env)) {
    const { artifact } = library.downloads;
    tasks.push({ url: artifact.url, sha1: artifact.sha1, size: artifact.size, path: libraryPath(paths, artifact.path) });
  }
  const logging = version.logging?.client?.file;
  if (logging) {
    tasks.push({ url: logging.url, sha1: logging.sha1, size: logging.size, path: loggingConfigPath(paths, logging.id) });
  }
  // Several names can share one hash; each object is downloaded once.
  const seen = new Set<string>();
  for (const { hash, size } of Object.values(assets.objects)) {
    if (seen.has(hash) || !/^[0-9a-f]{40}$/.test(hash)) continue;
    seen.add(hash);
    const prefix = hash.slice(0, 2);
    tasks.push({ url: `${ASSET_SERVER}/${prefix}/${hash}`, sha1: hash, size, path: join(paths.assets, 'objects', prefix, hash) });
  }
  return tasks;
}
