import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

/** The only hosts the launcher downloads from: the official Mojang servers. */
export const MOJANG_HOSTS: readonly string[] = [
  'piston-meta.mojang.com',
  'piston-data.mojang.com',
  'launchermeta.mojang.com',
  'libraries.minecraft.net',
  'resources.download.minecraft.net'
];

export function isMojangUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && MOJANG_HOSTS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

/** One file to download. sha1 and size come from Mojang's metadata. */
export interface DownloadTask {
  url: string;
  path: string;
  sha1?: string;
  size?: number;
}

export interface DownloadOptions {
  /** Decides which URLs may be loaded; only Mojang servers by default. Tests use a local server. */
  isAllowedUrl?: (url: string) => boolean;
  signal?: AbortSignal;
  /** Attempts per file before the download fails. */
  attempts?: number;
  /** Waiting time before the second attempt; doubles with every further attempt. */
  retryDelayMs?: number;
}

export class DownloadError extends Error {
  constructor(
    message: string,
    readonly url: string
  ) {
    super(message);
    this.name = 'DownloadError';
  }
}

export async function sha1OfFile(path: string): Promise<string> {
  const hash = createHash('sha1');
  await pipeline(createReadStream(path), hash);
  return hash.digest('hex');
}

/**
 * True if the file already exists with the expected size and checksum, so it does not
 * have to be downloaded again (this makes interrupted installs resume).
 */
export async function isFileValid(task: DownloadTask): Promise<boolean> {
  try {
    const info = await stat(task.path);
    if (!info.isFile() || (task.size !== undefined && info.size !== task.size)) {
      return false;
    }
    return task.sha1 === undefined || (await sha1OfFile(task.path)) === task.sha1;
  } catch {
    return false;
  }
}

/** Waits, but stops early (with the abort reason) when the signal fires. */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true }
    );
  });
}

/**
 * Downloads one file. It is written to <path>.part first, checked against sha1 and size,
 * and only then renamed, so a half-written file never looks complete.
 * onBytes reports every received chunk (for the progress bar); bytes of a failed
 * attempt are reported back as a negative number.
 */
async function downloadOnce(task: DownloadTask, options: DownloadOptions, onBytes: (bytes: number) => void): Promise<void> {
  const part = `${task.path}.part`;
  await mkdir(dirname(task.path), { recursive: true });
  let received = 0;
  try {
    const response = await fetch(task.url, { signal: options.signal, redirect: 'error' });
    if (!response.ok || !response.body) {
      throw new DownloadError(`HTTP ${response.status}`, task.url);
    }
    const hash = createHash('sha1');
    const counter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        hash.update(chunk);
        received += chunk.length;
        onBytes(chunk.length);
        callback(null, chunk);
      }
    });
    await pipeline(Readable.fromWeb(response.body), counter, createWriteStream(part), { signal: options.signal });
    if (task.size !== undefined && received !== task.size) {
      throw new DownloadError(`Size ${received} instead of ${task.size}`, task.url);
    }
    if (task.sha1 !== undefined && hash.digest('hex') !== task.sha1) {
      throw new DownloadError('Checksum does not match', task.url);
    }
    await rename(part, task.path);
  } catch (error) {
    onBytes(-received);
    await rm(part, { force: true });
    throw error;
  }
}

/** Downloads one file unless it is already valid; retries failed attempts. */
export async function downloadFile(
  task: DownloadTask,
  options: DownloadOptions = {},
  onBytes: (bytes: number) => void = () => {}
): Promise<void> {
  const isAllowedUrl = options.isAllowedUrl ?? isMojangUrl;
  if (!isAllowedUrl(task.url)) {
    throw new DownloadError('URL is not on the list of allowed download servers', task.url);
  }
  if (await isFileValid(task)) {
    onBytes(task.size ?? 0);
    return;
  }
  const attempts = options.attempts ?? 3;
  const retryDelayMs = options.retryDelayMs ?? 1000;
  for (let attempt = 1; ; attempt++) {
    try {
      await downloadOnce(task, options, onBytes);
      return;
    } catch (error) {
      if (options.signal?.aborted || attempt >= attempts) {
        throw error;
      }
      await delay(retryDelayMs * 2 ** (attempt - 1), options.signal);
    }
  }
}

export interface BatchProgress {
  completedFiles: number;
  totalFiles: number;
  completedBytes: number;
  totalBytes: number;
}

/**
 * Downloads many files with a limited number running at the same time.
 * The first error cancels the remaining downloads and is thrown.
 */
export async function downloadAll(
  tasks: readonly DownloadTask[],
  options: DownloadOptions & { concurrency?: number; onProgress?: (progress: BatchProgress) => void } = {}
): Promise<void> {
  const progress: BatchProgress = {
    completedFiles: 0,
    totalFiles: tasks.length,
    completedBytes: 0,
    totalBytes: tasks.reduce((sum, task) => sum + (task.size ?? 0), 0)
  };
  const report = () => options.onProgress?.({ ...progress });
  report();

  // One failure stops the others; an outer cancel is passed on as well.
  const controller = new AbortController();
  const onOuterAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener('abort', onOuterAbort, { once: true });
  const signal = controller.signal;

  let next = 0;
  const worker = async () => {
    while (next < tasks.length && !signal.aborted) {
      const task = tasks[next++];
      if (!task) {
        return;
      }
      await downloadFile(task, { ...options, signal }, (bytes) => {
        progress.completedBytes += bytes;
        report();
      });
      progress.completedFiles++;
      report();
    }
  };

  // Only the first real error counts; the other workers then fail because of the abort.
  let firstError: unknown = null;
  try {
    const workers = Array.from({ length: Math.min(options.concurrency ?? 8, tasks.length) }, () =>
      worker().catch((error: unknown) => {
        if (firstError === null) {
          firstError = error;
          controller.abort(error);
        }
      })
    );
    await Promise.all(workers);
    if (options.signal?.aborted) {
      throw options.signal.reason;
    }
    if (firstError !== null) {
      throw firstError;
    }
  } finally {
    options.signal?.removeEventListener('abort', onOuterAbort);
  }
}
