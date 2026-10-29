import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { isInstanceId, normalizeInstanceName, type Instance } from '../../shared/instances';
import type { GamePaths } from './paths';

interface InstancesFile {
  version: 1;
  instances: Instance[];
}

function isInstance(value: unknown): value is Instance {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Partial<Instance>;
  return (
    isInstanceId(entry.id) &&
    normalizeInstanceName(entry.name) === entry.name &&
    typeof entry.versionId === 'string' &&
    typeof entry.createdAt === 'string'
  );
}

/**
 * Keeps the list of instances in instances.json (game folder) and manages
 * the instance folders. Invalid entries in the file are skipped.
 */
export class InstanceStore {
  private instances: Instance[] = [];
  private loaded = false;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly paths: GamePaths) {}

  private get file(): string {
    return join(this.paths.root, 'instances.json');
  }

  /** Folder of an instance; the id is checked so the path can never leave the instances folder. */
  folder(id: string): string {
    if (!isInstanceId(id)) {
      throw new Error('Invalid instance id');
    }
    const folder = resolve(this.paths.instances, id);
    if (!folder.startsWith(resolve(this.paths.instances) + sep)) {
      throw new Error('Invalid instance folder');
    }
    return folder;
  }

  private async load(): Promise<void> {
    if (this.loaded) {
      return;
    }
    try {
      const data = JSON.parse((await readFile(this.file, 'utf8')).replace(/^﻿/, '')) as Partial<InstancesFile>;
      this.instances = Array.isArray(data.instances) ? data.instances.filter(isInstance) : [];
    } catch {
      // No file yet or unreadable: start with an empty list.
      this.instances = [];
    }
    this.loaded = true;
  }

  // Same approach as settings.json: temporary file, then rename; writes run one after another.
  private save(): Promise<void> {
    const data: InstancesFile = { version: 1, instances: this.instances };
    const text = `${JSON.stringify(data, null, 2)}\n`;
    this.writeQueue = this.writeQueue.then(async () => {
      await mkdir(this.paths.root, { recursive: true });
      await writeFile(`${this.file}.tmp`, text, 'utf8');
      await rename(`${this.file}.tmp`, this.file);
    });
    return this.writeQueue;
  }

  async list(): Promise<Instance[]> {
    await this.load();
    return [...this.instances];
  }

  async get(id: string): Promise<Instance | null> {
    await this.load();
    return this.instances.find((instance) => instance.id === id) ?? null;
  }

  async create(rawName: unknown, versionId: string): Promise<Instance> {
    const name = normalizeInstanceName(rawName);
    if (!name) {
      throw new Error('Invalid instance name');
    }
    await this.load();
    const instance: Instance = { id: randomUUID(), name, versionId, createdAt: new Date().toISOString() };
    await mkdir(this.folder(instance.id), { recursive: true });
    this.instances.push(instance);
    await this.save();
    return instance;
  }

  async rename(id: string, rawName: unknown): Promise<Instance> {
    const name = normalizeInstanceName(rawName);
    if (!name) {
      throw new Error('Invalid instance name');
    }
    await this.load();
    const index = this.instances.findIndex((instance) => instance.id === id);
    const current = this.instances[index];
    if (!current) {
      throw new Error('Instance not found');
    }
    const renamed = { ...current, name };
    this.instances[index] = renamed;
    await this.save();
    return renamed;
  }

  /** Removes the instance and deletes its folder with everything in it. */
  async remove(id: string): Promise<void> {
    await this.load();
    const folder = this.folder(id);
    if (!this.instances.some((instance) => instance.id === id)) {
      throw new Error('Instance not found');
    }
    this.instances = this.instances.filter((instance) => instance.id !== id);
    await this.save();
    await rm(folder, { recursive: true, force: true });
  }
}
