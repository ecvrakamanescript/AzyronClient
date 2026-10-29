import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { GamePaths } from './paths';
import { clientJarPath } from './versionJson';
import { readZipEntry } from './zip';

// Minecraft's default skin is a Mojang file and is never shipped with the launcher.
// It is read from the game file the user downloaded from Mojang, if a version is installed.
const STEVE_IN_CLIENT = 'assets/minecraft/textures/entity/player/wide/steve.png';
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_SKIN_BYTES = 64 * 1024;

/** Installed versions, most recently installed first. */
async function installedVersions(paths: GamePaths): Promise<string[]> {
  let folders: string[];
  try {
    folders = await readdir(paths.versions);
  } catch {
    return [];
  }
  const installed: { id: string; completedAt: string }[] = [];
  for (const id of folders) {
    try {
      const marker = JSON.parse(await readFile(join(paths.versions, id, 'install.json'), 'utf8')) as {
        versionId?: unknown;
        completedAt?: unknown;
      };
      if (marker.versionId === id && typeof marker.completedAt === 'string') {
        installed.push({ id, completedAt: marker.completedAt });
      }
    } catch {
      // Not installed (yet).
    }
  }
  return installed.sort((a, b) => b.completedAt.localeCompare(a.completedAt)).map((entry) => entry.id);
}

/**
 * Minecraft's default skin (Steve, wide arms) as a data URL, read from an installed
 * client jar; null if no installed version contains it.
 */
export async function readDefaultSkin(paths: GamePaths): Promise<string | null> {
  for (const versionId of await installedVersions(paths)) {
    try {
      const png = await readZipEntry(clientJarPath(paths, versionId), STEVE_IN_CLIENT, MAX_SKIN_BYTES);
      if (png && png.subarray(0, 8).equals(PNG_SIGNATURE)) {
        return `data:image/png;base64,${png.toString('base64')}`;
      }
    } catch (error) {
      console.warn(`Default skin could not be read from version ${versionId}:`, error);
    }
  }
  return null;
}
