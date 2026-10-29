import { createHash } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { javaExecutable, planRuntime, platformKey, runtimeFolder } from './java';
import { createGamePaths, type GamePaths } from './paths';

// The server answers with whatever runtime manifest the current test sets.
let manifestText = '';
let server: Server;
let base = '';

const sha1 = (text: string) => createHash('sha1').update(text).digest('hex');

beforeAll(async () => {
  server = createServer((request, response) => {
    if (request.url === '/manifest.json') {
      response.writeHead(200).end(manifestText);
    } else if (request.url === '/all.json') {
      const manifest = { url: `${base}/manifest.json`, sha1: sha1(manifestText), size: Buffer.byteLength(manifestText) };
      response.writeHead(200).end(JSON.stringify({ 'windows-x64': { 'java-runtime-delta': [{ manifest, version: { name: '21.0.7' } }] } }));
    } else {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

let paths: GamePaths;
const options = () => ({ indexUrl: `${base}/all.json`, isAllowedUrl: (url: string) => url.startsWith(base) });

beforeEach(async () => {
  const dir = await mkdtemp(join(tmpdir(), 'azyron-java-'));
  paths = createGamePaths(dir);
  return () => rm(dir, { recursive: true, force: true });
});

describe('planRuntime', () => {
  it('lists files and folders of the runtime inside its own folder', async () => {
    const raw = { url: 'https://piston-data.mojang.com/v1/objects/x/javaw.exe', sha1: 'a'.repeat(40), size: 3 };
    manifestText = JSON.stringify({
      files: { bin: { type: 'directory' }, 'bin/javaw.exe': { type: 'file', downloads: { raw } }, 'lib/link': { type: 'link' } }
    });
    const plan = await planRuntime(paths, 'java-runtime-delta', 'x64', options());
    expect(plan.version).toBe('21.0.7');
    expect(plan.directories).toEqual([join(paths.runtimes, 'java-runtime-delta', 'bin')]);
    expect(plan.tasks).toEqual([{ ...raw, path: javaExecutable(paths, 'java-runtime-delta') }]);
  });

  it('rejects paths that would leave the runtime folder', async () => {
    manifestText = JSON.stringify({ files: { '../evil.exe': { type: 'file', downloads: { raw: { url: 'x', sha1: 'x', size: 1 } } } } });
    await expect(planRuntime(paths, 'java-runtime-delta', 'x64', options())).rejects.toThrow('Invalid path');
  });

  it('reports a runtime that Mojang does not offer for this processor', async () => {
    manifestText = JSON.stringify({ files: {} });
    await expect(planRuntime(paths, 'java-runtime-delta', 'arm64', options())).rejects.toThrow('windows-arm64');
    await expect(planRuntime(paths, 'jre-legacy', 'x64', options())).rejects.toThrow('no Java runtime jre-legacy');
  });
});

describe('runtime names and paths', () => {
  it('maps processors to Mojang platforms', () => {
    expect(platformKey('x64')).toBe('windows-x64');
    expect(platformKey('arm64')).toBe('windows-arm64');
  });

  it('only accepts simple runtime names', () => {
    expect(() => runtimeFolder(paths, '../x')).toThrow('Invalid Java runtime name');
    expect(javaExecutable(paths, 'java-runtime-epsilon', true)).toBe(join(paths.runtimes, 'java-runtime-epsilon', 'bin', 'java.exe'));
  });
});
