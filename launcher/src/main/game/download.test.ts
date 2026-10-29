import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile, readdir } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { downloadAll, downloadFile, isMojangUrl, type DownloadOptions } from './download';

// A small local web server replaces the Mojang servers in these tests.
const files: Record<string, Buffer> = {
  '/a.txt': Buffer.from('first file'),
  '/b.txt': Buffer.from('second file, a bit longer'),
  '/c.txt': Buffer.from('third')
};
let failuresLeft = 0;
let requests = 0;
let server: Server;
let base = '';
let dir = '';
const local: DownloadOptions = { isAllowedUrl: (url) => url.startsWith(base), retryDelayMs: 1 };

const sha1 = (data: Buffer) => createHash('sha1').update(data).digest('hex');
const task = (name: string) => ({
  url: `${base}/${name}`,
  path: join(dir, name),
  sha1: sha1(files[`/${name}`]!),
  size: files[`/${name}`]!.length
});

beforeAll(async () => {
  server = createServer((request, response) => {
    requests++;
    const body = files[request.url ?? ''];
    if (failuresLeft > 0) {
      failuresLeft--;
      response.writeHead(503).end();
    } else if (body) {
      response.writeHead(200).end(body);
    } else {
      response.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'azyron-download-'));
  failuresLeft = 0;
  requests = 0;
  return () => rm(dir, { recursive: true, force: true });
});

describe('isMojangUrl', () => {
  it('accepts the official Mojang servers over https', () => {
    expect(isMojangUrl('https://piston-data.mojang.com/v1/objects/abc/client.jar')).toBe(true);
    expect(isMojangUrl('https://resources.download.minecraft.net/ab/abcdef')).toBe(true);
  });

  it('rejects other hosts, plain http and invalid URLs', () => {
    expect(isMojangUrl('http://piston-data.mojang.com/x')).toBe(false);
    expect(isMojangUrl('https://piston-data.mojang.com.evil.example/x')).toBe(false);
    expect(isMojangUrl('https://example.com/x')).toBe(false);
    expect(isMojangUrl('not a url')).toBe(false);
  });
});

describe('downloadFile', () => {
  it('downloads and verifies a file', async () => {
    await downloadFile(task('a.txt'), local);
    expect(await readFile(join(dir, 'a.txt'))).toEqual(files['/a.txt']);
  });

  it('refuses URLs that are not allowed, without a request', async () => {
    await expect(downloadFile(task('a.txt'))).rejects.toThrow('not on the list');
    expect(requests).toBe(0);
  });

  it('skips a file that is already valid', async () => {
    await writeFile(join(dir, 'a.txt'), files['/a.txt']!);
    await downloadFile(task('a.txt'), local);
    expect(requests).toBe(0);
  });

  it('replaces a damaged file', async () => {
    await writeFile(join(dir, 'a.txt'), 'damaged!!!');
    await downloadFile(task('a.txt'), local);
    expect(await readFile(join(dir, 'a.txt'))).toEqual(files['/a.txt']);
  });

  it('rejects a wrong checksum and leaves no file behind', async () => {
    await expect(downloadFile({ ...task('a.txt'), sha1: '0'.repeat(40) }, local)).rejects.toThrow('Checksum');
    expect(await readdir(dir)).toEqual([]);
  });

  it('retries after server errors', async () => {
    failuresLeft = 2;
    await downloadFile(task('a.txt'), local);
    expect(requests).toBe(3);
  });

  it('gives up after the last attempt', async () => {
    failuresLeft = 5;
    await expect(downloadFile(task('a.txt'), { ...local, attempts: 2 })).rejects.toThrow('HTTP 503');
    expect(requests).toBe(2);
  });
});

describe('downloadAll', () => {
  it('downloads all files and reports the progress', async () => {
    const tasks = [task('a.txt'), task('b.txt'), task('c.txt')];
    const reports: number[] = [];
    await downloadAll(tasks, { ...local, concurrency: 2, onProgress: (p) => reports.push(p.completedFiles) });
    expect((await readdir(dir)).sort()).toEqual(['a.txt', 'b.txt', 'c.txt']);
    expect(reports.at(-1)).toBe(3);
  });

  it('stops at the first error and throws it', async () => {
    const tasks = [task('a.txt'), { ...task('b.txt'), url: `${base}/missing.txt` }, task('c.txt')];
    await expect(downloadAll(tasks, { ...local, concurrency: 1, attempts: 1 })).rejects.toThrow('HTTP 404');
    expect(await readdir(dir)).toEqual(['a.txt']);
  });

  it('can be cancelled', async () => {
    const controller = new AbortController();
    controller.abort(new Error('cancelled by user'));
    await expect(downloadAll([task('a.txt')], { ...local, signal: controller.signal })).rejects.toThrow('cancelled by user');
  });
});
