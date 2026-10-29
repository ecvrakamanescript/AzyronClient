import { execFile } from 'node:child_process';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { downloadFile, type DownloadOptions, type DownloadTask } from './download';
import { fetchJson } from './manifest';
import type { GamePaths } from './paths';
import type { WindowsArch } from './rules';
import type { RemoteFile } from './versionJson';

/** Mojang's list of Java runtimes for all platforms (the official Minecraft launcher uses it too). */
export const JAVA_RUNTIME_INDEX_URL =
  'https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json';

type RuntimeIndex = Record<string, Record<string, { manifest: RemoteFile; version: { name: string } }[]>>;

interface RuntimeManifest {
  files: Record<string, { type: 'file' | 'directory' | 'link'; downloads?: { raw: RemoteFile } }>;
}

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export function platformKey(arch: WindowsArch): string {
  return { x64: 'windows-x64', arm64: 'windows-arm64', x86: 'windows-x86' }[arch];
}

export function runtimeFolder(paths: GamePaths, component: string): string {
  if (!/^[a-z0-9-]+$/.test(component)) {
    throw new Error(`Invalid Java runtime name: ${component}`);
  }
  return join(paths.runtimes, component);
}

/** javaw.exe starts the game without a console window; java.exe is used for the probe. */
export function javaExecutable(paths: GamePaths, component: string, console = false): string {
  return join(runtimeFolder(paths, component), 'bin', console ? 'java.exe' : 'javaw.exe');
}

function markerPath(paths: GamePaths, component: string): string {
  return join(runtimeFolder(paths, component), 'azyron-runtime.json');
}

export interface RuntimePlan {
  version: string;
  tasks: DownloadTask[];
  directories: string[];
}

/**
 * Finds the runtime for this computer and lists its files. The runtime manifest itself
 * is downloaded with its checksum, so every file in it can be trusted.
 */
export async function planRuntime(
  paths: GamePaths,
  component: string,
  arch: WindowsArch,
  options: DownloadOptions & { indexUrl?: string } = {}
): Promise<RuntimePlan> {
  const folder = runtimeFolder(paths, component);
  const index = await fetchJson(options.indexUrl ?? JAVA_RUNTIME_INDEX_URL, options);
  const entry = isObject(index) ? (index as RuntimeIndex)[platformKey(arch)]?.[component]?.[0] : undefined;
  if (!entry) {
    throw new Error(`Mojang offers no Java runtime ${component} for ${platformKey(arch)}`);
  }

  const manifestPath = join(paths.runtimes, `${component}.manifest.json`);
  await downloadFile({ ...entry.manifest, path: manifestPath }, options);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as RuntimeManifest;
  if (!isObject(manifest) || !isObject(manifest.files)) {
    throw new Error(`Java runtime manifest of ${component} has an unexpected format`);
  }

  const tasks: DownloadTask[] = [];
  const directories: string[] = [];
  for (const [relative, file] of Object.entries(manifest.files)) {
    // Paths come from Mojang's data; they must stay inside the runtime folder.
    const parts = relative.split('/');
    if (isAbsolute(relative) || parts.some((part) => part === '..' || part === '')) {
      throw new Error(`Invalid path in Java runtime manifest: ${relative}`);
    }
    const target = join(folder, ...parts);
    if (file.type === 'directory') {
      directories.push(target);
    } else if (file.type === 'file' && file.downloads?.raw) {
      tasks.push({ ...file.downloads.raw, path: target });
    }
    // Links only exist in the macOS and Linux runtimes.
  }
  return { version: entry.version.name, tasks, directories };
}

export async function createRuntimeDirectories(plan: RuntimePlan): Promise<void> {
  for (const directory of plan.directories) await mkdir(directory, { recursive: true });
}

export async function writeRuntimeMarker(paths: GamePaths, component: string, version: string): Promise<void> {
  const marker = { component, version, completedAt: new Date().toISOString() };
  await writeFile(markerPath(paths, component), `${JSON.stringify(marker, null, 2)}\n`, 'utf8');
}

/** True if the runtime was installed completely and javaw.exe exists. */
export async function isRuntimeInstalled(paths: GamePaths, component: string): Promise<boolean> {
  try {
    const marker = JSON.parse(await readFile(markerPath(paths, component), 'utf8')) as { component?: unknown };
    await access(javaExecutable(paths, component));
    return marker.component === component;
  } catch {
    return false;
  }
}

/** Runs "java -version" and returns the version, e.g. 25.0.1. Fails if Java does not start. */
export function probeJava(executable: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(executable, ['-version'], { timeout: 15_000, windowsHide: true }, (error, _stdout, stderr) => {
      if (error) {
        reject(new Error(`Java does not start: ${error.message}`));
        return;
      }
      // Java prints e.g.: openjdk version "25.0.1" 2025-10-21
      const match = /version "([^"]+)"/.exec(stderr);
      if (!match?.[1]) {
        reject(new Error('Java did not report its version'));
        return;
      }
      resolve(match[1]);
    });
  });
}
