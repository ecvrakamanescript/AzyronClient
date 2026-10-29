import { join } from 'node:path';

/**
 * Folder layout of the game data. Versions, libraries, assets and Java runtimes are
 * shared by all instances; every instance has its own game folder.
 * The user's .minecraft folder is never touched.
 */
export interface GamePaths {
  root: string;
  versions: string;
  libraries: string;
  assets: string;
  runtimes: string;
  instances: string;
}

export function createGamePaths(root: string): GamePaths {
  return {
    root,
    versions: join(root, 'versions'),
    libraries: join(root, 'libraries'),
    assets: join(root, 'assets'),
    runtimes: join(root, 'runtimes'),
    instances: join(root, 'instances')
  };
}
