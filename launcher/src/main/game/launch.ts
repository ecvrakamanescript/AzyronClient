import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { LaunchCheck } from '../../shared/launch';
import { isRuntimeInstalled, javaExecutable } from './java';
import type { GamePaths } from './paths';
import { rulesAllow, type RuleEnvironment } from './rules';
import {
  assetIndexPath,
  clientJarPath,
  gameFileTasks,
  isAssetIndex,
  isVersionJson,
  libraryPath,
  loggingConfigPath,
  selectLibraries,
  versionFolder,
  versionJsonPath,
  type Argument,
  type VersionJson
} from './versionJson';

/** Memory for the game until it can be set in the settings. */
export const DEFAULT_MEMORY_MB = 2048;

/** The signed-in Minecraft account (from the Microsoft login, phase 2.7). */
export interface LaunchAccount {
  name: string;
  uuid: string;
  accessToken: string;
  xuid: string;
}

export interface LaunchOptions {
  paths: GamePaths;
  version: VersionJson;
  env: RuleEnvironment;
  /** Folder of the instance: worlds, settings, screenshots. */
  gameDirectory: string;
  account: LaunchAccount;
  launcherVersion: string;
  memoryMb?: number;
  resolution?: { width: number; height: number };
}

export interface LaunchCommand {
  executable: string;
  args: string[];
  cwd: string;
}

/** Replaces ${name} placeholders; unknown placeholders stay as they are. */
function substitute(text: string, values: Readonly<Record<string, string>>): string {
  return text.replace(/\$\{([a-zA-Z_]+)\}/g, (match, name: string) => values[name] ?? match);
}

function expand(args: readonly Argument[], env: RuleEnvironment, values: Readonly<Record<string, string>>): string[] {
  const result: string[] = [];
  for (const arg of args) {
    if (typeof arg === 'string') {
      result.push(substitute(arg, values));
    } else if (rulesAllow(arg.rules, env)) {
      for (const value of Array.isArray(arg.value) ? arg.value : [arg.value]) result.push(substitute(value, values));
    }
  }
  return result;
}

/** Folder for native libraries that LWJGL and others unpack at start. */
export function nativesDirectory(paths: GamePaths, versionId: string): string {
  return join(versionFolder(paths, versionId), 'natives');
}

/** Classpath in the order of the version file, the client jar last (like the official launcher). */
export function classpath(paths: GamePaths, version: VersionJson, env: RuleEnvironment): string[] {
  return [
    ...selectLibraries(version, env).map((library) => libraryPath(paths, library.downloads.artifact.path)),
    clientJarPath(paths, version.id)
  ];
}

/**
 * Builds the Java command that starts Minecraft, following the rules and placeholders
 * in the version file. It contains the access token: never log it without redactCommand.
 */
export function buildLaunchCommand(options: LaunchOptions): LaunchCommand {
  const { paths, version, account } = options;
  const env: RuleEnvironment = {
    ...options.env,
    features: { ...options.env.features, is_demo_user: false, has_custom_resolution: options.resolution !== undefined }
  };
  const values: Record<string, string> = {
    auth_player_name: account.name,
    auth_uuid: account.uuid,
    auth_access_token: account.accessToken,
    auth_xuid: account.xuid,
    user_type: 'msa',
    clientid: '',
    version_name: version.id,
    version_type: version.type,
    game_directory: options.gameDirectory,
    assets_root: paths.assets,
    assets_index_name: version.assetIndex.id,
    natives_directory: nativesDirectory(paths, version.id),
    library_directory: paths.libraries,
    classpath_separator: ';',
    classpath: classpath(paths, version, env).join(';'),
    launcher_name: 'azyron-client',
    launcher_version: options.launcherVersion,
    resolution_width: String(options.resolution?.width ?? ''),
    resolution_height: String(options.resolution?.height ?? '')
  };

  const jvm = [`-Xmx${options.memoryMb ?? DEFAULT_MEMORY_MB}M`, ...expand(version.arguments.jvm, env, values)];
  const logging = version.logging?.client;
  if (logging) {
    jvm.push(substitute(logging.argument, { path: loggingConfigPath(paths, logging.file.id) }));
  }
  return {
    executable: javaExecutable(paths, version.javaVersion.component),
    args: [...jvm, version.mainClass, ...expand(version.arguments.game, env, values)],
    cwd: options.gameDirectory
  };
}

/** Copy of the arguments with the access token replaced, safe for logs and the UI. */
export function redactCommand(args: readonly string[], accessToken: string): string[] {
  return accessToken ? args.map((arg) => arg.split(accessToken).join('<access token>')) : [...args];
}

/** Account used for the command preview while nobody is signed in; it carries no token. */
const PREVIEW_ACCOUNT: LaunchAccount = { name: 'Player', uuid: '0'.repeat(32), accessToken: '', xuid: '0' };

export interface CheckOptions {
  paths: GamePaths;
  versionId: string;
  env: RuleEnvironment;
  gameDirectory: string;
  launcherVersion: string;
  probeJava: (executable: string) => Promise<string>;
}

/**
 * Checks everything a start needs without starting the game: version file, all game files
 * (existence and size, fast enough for every start), the Java runtime and a Java probe.
 */
export async function checkLaunch(options: CheckOptions): Promise<LaunchCheck> {
  const { paths, versionId, env } = options;
  const notReady: LaunchCheck = { filesReady: false, missingFiles: 0, javaVersion: null, commandPreview: [] };

  let version: unknown;
  let assets: unknown;
  try {
    version = JSON.parse(await readFile(versionJsonPath(paths, versionId), 'utf8'));
    if (!isVersionJson(version)) return notReady;
    assets = JSON.parse(await readFile(assetIndexPath(paths, version), 'utf8'));
    if (!isAssetIndex(assets)) return notReady;
  } catch {
    return notReady;
  }

  let missingFiles = 0;
  for (const task of gameFileTasks(paths, version, assets, env)) {
    const size = await stat(task.path).then(
      (info) => info.size,
      () => -1
    );
    if (size !== task.size) missingFiles++;
  }

  const component = version.javaVersion.component;
  const javaVersion = (await isRuntimeInstalled(paths, component))
    ? await options.probeJava(javaExecutable(paths, component, true)).catch(() => null)
    : null;
  if (javaVersion === null) missingFiles++;

  const command = buildLaunchCommand({
    paths,
    version,
    env,
    gameDirectory: options.gameDirectory,
    account: PREVIEW_ACCOUNT,
    launcherVersion: options.launcherVersion
  });
  return {
    filesReady: missingFiles === 0,
    missingFiles,
    javaVersion,
    commandPreview: [command.executable, ...command.args]
  };
}
