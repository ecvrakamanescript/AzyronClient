import { access, mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeInstanceName } from '../../shared/instances';
import { InstanceStore } from './instances';
import { createGamePaths, type GamePaths } from './paths';

const exists = (path: string) =>
  access(path).then(
    () => true,
    () => false
  );

let paths: GamePaths;

beforeEach(async () => {
  const dir = await mkdtemp(join(tmpdir(), 'azyron-instances-'));
  paths = createGamePaths(dir);
  return () => rm(dir, { recursive: true, force: true });
});

describe('normalizeInstanceName', () => {
  it('trims valid names', () => {
    expect(normalizeInstanceName('  PvP 26.3 ')).toBe('PvP 26.3');
  });

  it('rejects empty, too long, non-text and control characters', () => {
    expect(normalizeInstanceName('   ')).toBeNull();
    expect(normalizeInstanceName('x'.repeat(41))).toBeNull();
    expect(normalizeInstanceName(42)).toBeNull();
    expect(normalizeInstanceName('a\nb')).toBeNull();
  });
});

describe('InstanceStore', () => {
  it('creates an instance with its own folder and saves it', async () => {
    const store = new InstanceStore(paths);
    const instance = await store.create('Survival', '26.3');
    expect(await exists(store.folder(instance.id))).toBe(true);
    const saved = JSON.parse(await readFile(join(paths.root, 'instances.json'), 'utf8'));
    expect(saved.instances).toEqual([instance]);
    // A new store (next launcher start) reads the same list.
    expect(await new InstanceStore(paths).list()).toEqual([instance]);
  });

  it('renames an instance', async () => {
    const store = new InstanceStore(paths);
    const instance = await store.create('Old', '1.21');
    await store.rename(instance.id, ' New ');
    expect((await store.get(instance.id))?.name).toBe('New');
    await expect(store.rename(instance.id, '')).rejects.toThrow('Invalid instance name');
  });

  it('removes an instance and its folder', async () => {
    const store = new InstanceStore(paths);
    const keep = await store.create('Keep', '26.3');
    const gone = await store.create('Gone', '26.3');
    await writeFile(join(store.folder(gone.id), 'options.txt'), 'test');
    await store.remove(gone.id);
    expect((await store.list()).map((i) => i.name)).toEqual(['Keep']);
    expect(await exists(store.folder(gone.id))).toBe(false);
    expect(await exists(store.folder(keep.id))).toBe(true);
  });

  it('never resolves a folder outside the instances folder', () => {
    const store = new InstanceStore(paths);
    expect(() => store.folder('..')).toThrow('Invalid instance id');
    expect(() => store.folder('../../Windows')).toThrow('Invalid instance id');
  });

  it('skips invalid entries in a damaged file', async () => {
    await mkdir(paths.root, { recursive: true });
    await writeFile(
      join(paths.root, 'instances.json'),
      JSON.stringify({
        version: 1,
        instances: [
          { id: '../x', name: 'Bad', versionId: '26.3', createdAt: '' },
          { id: '1b4e28ba-2fa1-41d2-883f-0016d3cca427', name: 'Good', versionId: '26.3', createdAt: '2026-10-29' }
        ]
      })
    );
    expect((await new InstanceStore(paths).list()).map((i) => i.name)).toEqual(['Good']);
  });

  it('starts empty when the file is not valid JSON', async () => {
    await mkdir(paths.root, { recursive: true });
    await writeFile(join(paths.root, 'instances.json'), '{ broken');
    expect(await new InstanceStore(paths).list()).toEqual([]);
  });
});
