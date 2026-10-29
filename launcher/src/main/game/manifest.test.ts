import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loadManifest, supportedVersions, toVersionList, type VersionManifest } from './manifest';
import { createGamePaths, type GamePaths } from './paths';

// Hand-written manifest in Mojang's format (no Mojang files in the repository).
const entry = (id: string, type: string, releaseTime: string) => ({
  id,
  type,
  releaseTime,
  url: `https://piston-meta.mojang.com/v1/packages/x/${id}.json`,
  sha1: '0'.repeat(40)
});
const manifest: VersionManifest = {
  latest: { release: '26.1', snapshot: '26.2-snapshot-1' },
  versions: [
    entry('26.2-snapshot-1', 'snapshot', '2026-02-01T10:00:00+00:00'),
    entry('26.1', 'release', '2026-01-10T10:00:00+00:00'),
    entry('1.21.1', 'release', '2024-08-08T10:00:00+00:00'),
    entry('1.21', 'release', '2024-06-13T10:00:00+00:00'),
    entry('1.21-pre1', 'snapshot', '2024-05-29T10:00:00+00:00'),
    entry('1.20.6', 'release', '2024-04-29T10:00:00+00:00'),
    entry('b1.7.3', 'old_beta', '2011-07-07T22:00:00+00:00')
  ]
};

describe('supportedVersions', () => {
  it('keeps releases and snapshots from 1.21 on, newest first', () => {
    expect(supportedVersions(manifest).map((v) => v.id)).toEqual(['26.2-snapshot-1', '26.1', '1.21.1', '1.21']);
  });

  it('returns nothing if 1.21 is missing', () => {
    expect(supportedVersions({ ...manifest, versions: manifest.versions.filter((v) => v.id !== '1.21') })).toEqual([]);
  });
});

describe('toVersionList', () => {
  it('hides snapshots unless requested', () => {
    expect(toVersionList(manifest, false, false).versions.map((v) => v.id)).toEqual(['26.1', '1.21.1', '1.21']);
    expect(toVersionList(manifest, false, true).versions).toHaveLength(4);
  });

  it('names the latest versions', () => {
    const list = toVersionList(manifest, true, false);
    expect(list).toMatchObject({ latestRelease: '26.1', latestSnapshot: '26.2-snapshot-1', offline: true });
  });
});

describe('loadManifest', () => {
  let server: Server;
  let url = '';
  let online = true;
  let dir = '';
  let paths: GamePaths;
  const options = () => ({ url, isAllowedUrl: (u: string) => u.startsWith('http://127.0.0.1') });

  beforeAll(async () => {
    server = createServer((_request, response) => {
      if (online) {
        response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(manifest));
      } else {
        response.writeHead(500).end();
      }
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/manifest.json`;
  });

  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'azyron-manifest-'));
    paths = createGamePaths(dir);
    online = true;
    return () => rm(dir, { recursive: true, force: true });
  });

  it('loads the manifest and saves a copy', async () => {
    const result = await loadManifest(paths, options());
    expect(result.offline).toBe(false);
    expect(JSON.parse(await readFile(join(paths.versions, 'version_manifest_v2.json'), 'utf8'))).toEqual(manifest);
  });

  it('uses the saved copy when Mojang cannot be reached', async () => {
    await loadManifest(paths, options());
    online = false;
    const result = await loadManifest(paths, options());
    expect(result).toEqual({ manifest, offline: true });
  });

  it('fails without connection and without a saved copy', async () => {
    online = false;
    await expect(loadManifest(paths, options())).rejects.toThrow('HTTP 500');
  });
});
