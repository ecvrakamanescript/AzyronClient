import { createHash } from 'node:crypto';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { InstallStateEvent } from '../../shared/install';
import { InstallManager } from './install';
import { createGamePaths, type GamePaths } from './paths';
import type { VersionJson } from './versionJson';

// Local server with a tiny "version": one client jar, one library, two asset objects.
const content = new Map<string, Buffer>();
const missing = new Set<string>();
let delayMs = 0;
let server: Server;
let base = '';

const sha1 = (data: Buffer) => createHash('sha1').update(data).digest('hex');
const remote = (path: string, data: string) => {
  const buffer = Buffer.from(data);
  content.set(path, buffer);
  return { url: `${base}${path}`, sha1: sha1(buffer), size: buffer.length };
};

let versionEntry: { id: string; type: string; url: string; sha1: string; releaseTime: string };

beforeAll(async () => {
  server = createServer((request, response) => {
    const body = content.get(request.url ?? '');
    setTimeout(() => {
      if (!body || missing.has(request.url ?? '')) {
        response.writeHead(404).end();
      } else {
        response.writeHead(200).end(body);
      }
    }, delayMs);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const a = remote('/objects/a', 'asset a');
  const b = remote('/objects/b', 'asset b');
  const index = remote('/indexes/1.json', JSON.stringify({ objects: { 'a.txt': { hash: a.sha1, size: a.size }, 'b.txt': { hash: b.sha1, size: b.size } } }));
  // Asset objects are always loaded from Mojang's asset server; the test serves them under that path too.
  content.set(`/${a.sha1.slice(0, 2)}/${a.sha1}`, Buffer.from('asset a'));
  content.set(`/${b.sha1.slice(0, 2)}/${b.sha1}`, Buffer.from('asset b'));
  const version: VersionJson = {
    id: '26.3',
    type: 'release',
    mainClass: 'net.minecraft.client.main.Main',
    assets: '1',
    assetIndex: { ...index, id: '1', totalSize: 14 },
    downloads: { client: remote('/client.jar', 'client jar') },
    libraries: [{ name: 'com.example:lib:1.0', downloads: { artifact: { ...remote('/lib.jar', 'library'), path: 'com/example/lib/1.0/lib-1.0.jar' } } }],
    javaVersion: { component: 'java-runtime-epsilon', majorVersion: 25 },
    arguments: { game: [], jvm: [] }
  };
  versionEntry = { id: '26.3', type: 'release', releaseTime: '2026-09-15T00:00:00+00:00', ...remote('/26.3.json', JSON.stringify(version)) };
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

let paths: GamePaths;
let events: InstallStateEvent[];
let manager: InstallManager;

beforeEach(async () => {
  const dir = await mkdtemp(join(tmpdir(), 'azyron-install-'));
  paths = createGamePaths(dir);
  events = [];
  missing.clear();
  delayMs = 0;
  manager = new InstallManager(
    {
      paths,
      env: { arch: 'x64', osVersion: '10.0', features: {} },
      findVersion: async () => versionEntry,
      // Assets come from "resources.download.minecraft.net"; the test redirects them to the local server.
      downloadOptions: { isAllowedUrl: () => true, retryDelayMs: 1, attempts: 1 }
    },
    (event) => events.push(event)
  );
  return () => rm(dir, { recursive: true, force: true });
});

/** Waits until the manager reports a final state. */
const finished = () =>
  new Promise<InstallStateEvent>((resolve) => {
    const timer = setInterval(() => {
      const last = events.at(-1);
      if (last && last.state.status !== 'installing') {
        clearInterval(timer);
        resolve(last);
      }
    }, 5);
  });

// The asset URLs point to Mojang; fetch them from the test server instead.
const realFetch = globalThis.fetch;
beforeAll(() => {
  globalThis.fetch = (input, init) => {
    const url = String(input).replace('https://resources.download.minecraft.net', base);
    return realFetch(url, init);
  };
  return () => {
    globalThis.fetch = realFetch;
  };
});

describe('InstallManager', () => {
  it('installs all files and marks the version as installed', async () => {
    expect(await manager.getState('26.3')).toEqual({ status: 'not-installed' });
    manager.start('26.3');
    expect((await finished()).state).toEqual({ status: 'installed' });
    expect(await manager.getState('26.3')).toEqual({ status: 'installed' });
    await access(join(paths.versions, '26.3', '26.3.jar'));
    await access(join(paths.libraries, 'com', 'example', 'lib', '1.0', 'lib-1.0.jar'));
    expect(events[0]?.state.status).toBe('installing');
  });

  it('reports a missing file as a network failure', async () => {
    missing.add('/lib.jar');
    manager.start('26.3');
    const last = await finished();
    expect(last.state).toMatchObject({ status: 'failed', reason: 'network' });
    expect(await manager.getState('26.3')).toMatchObject({ status: 'failed' });
  });

  it('can be cancelled and is then not installed', async () => {
    delayMs = 50;
    manager.start('26.3');
    manager.cancel('26.3');
    expect((await finished()).state).toEqual({ status: 'not-installed' });
    expect(await manager.isInstalled('26.3')).toBe(false);
  });
});
