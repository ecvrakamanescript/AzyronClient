import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';
import { beforeEach, describe, expect, it } from 'vitest';
import { readZipEntry } from './zip';

/** Builds a small ZIP archive in memory (the format of a .jar), one entry stored, others deflated. */
function buildZip(entries: { name: string; data: Buffer; store?: boolean }[]): Buffer {
  const locals: Buffer[] = [];
  const directory: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const body = entry.store ? entry.data : deflateRawSync(entry.data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(entry.store ? 0 : 8, 8);
    header.writeUInt32LE(crc32(entry.data), 14);
    header.writeUInt32LE(body.length, 18);
    header.writeUInt32LE(entry.data.length, 22);
    header.writeUInt16LE(name.length, 26);
    locals.push(header, name, body);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(entry.store ? 0 : 8, 10);
    central.writeUInt32LE(crc32(entry.data), 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    directory.push(central, name);
    offset += header.length + name.length + body.length;
  }
  const directoryBuffer = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directoryBuffer.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, directoryBuffer, end]);
}

let dir = '';
let archive = '';
const skin = Buffer.from('fake png content '.repeat(20));

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'azyron-zip-'));
  archive = join(dir, 'client.jar');
  await writeFile(
    archive,
    buildZip([
      { name: 'META-INF/MANIFEST.MF', data: Buffer.from('Manifest-Version: 1.0\n'), store: true },
      { name: 'assets/minecraft/textures/entity/player/wide/steve.png', data: skin }
    ])
  );
  return () => rm(dir, { recursive: true, force: true });
});

describe('readZipEntry', () => {
  it('reads a compressed and a stored entry', async () => {
    expect(await readZipEntry(archive, 'assets/minecraft/textures/entity/player/wide/steve.png', 10_000)).toEqual(skin);
    expect((await readZipEntry(archive, 'META-INF/MANIFEST.MF', 10_000))?.toString()).toBe('Manifest-Version: 1.0\n');
  });

  it('returns null for a missing entry', async () => {
    expect(await readZipEntry(archive, 'missing.png', 10_000)).toBeNull();
  });

  it('rejects entries larger than allowed', async () => {
    await expect(readZipEntry(archive, 'assets/minecraft/textures/entity/player/wide/steve.png', 10)).rejects.toThrow('larger than expected');
  });

  it('rejects files that are not ZIP archives', async () => {
    const other = join(dir, 'other.jar');
    await writeFile(other, 'just text');
    await expect(readZipEntry(other, 'x', 10)).rejects.toThrow();
  });
});
