import { open } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';

// Minimal reader for single files in ZIP archives (a .jar is a ZIP archive).
// Only what the launcher needs: no ZIP64, no encryption; methods "stored" and "deflate".

const END_OF_DIRECTORY = 0x06054b50;
const DIRECTORY_ENTRY = 0x02014b50;
const LOCAL_HEADER = 0x04034b50;

/**
 * Reads one file from a ZIP archive without loading the whole archive.
 * Returns null if the file is not in the archive; files larger than maxSize are rejected.
 */
export async function readZipEntry(archivePath: string, entryName: string, maxSize: number): Promise<Buffer | null> {
  const file = await open(archivePath, 'r');
  try {
    const { size } = await file.stat();
    const read = async (position: number, length: number) => {
      const buffer = Buffer.alloc(length);
      const { bytesRead } = await file.read(buffer, 0, length, position);
      if (bytesRead !== length) throw new Error('ZIP archive is truncated');
      return buffer;
    };

    // The end record sits in the last 22 bytes plus an optional comment of up to 64 KB.
    const tailLength = Math.min(size, 22 + 0xffff);
    const tail = await read(size - tailLength, tailLength);
    let end = -1;
    for (let i = tail.length - 22; i >= 0; i--) {
      if (tail.readUInt32LE(i) === END_OF_DIRECTORY) {
        end = i;
        break;
      }
    }
    if (end < 0) throw new Error('Not a ZIP archive');
    const entryCount = tail.readUInt16LE(end + 10);
    const directorySize = tail.readUInt32LE(end + 12);
    const directoryOffset = tail.readUInt32LE(end + 16);
    if (entryCount === 0xffff || directoryOffset === 0xffffffff) throw new Error('ZIP64 archives are not supported');

    const directory = await read(directoryOffset, directorySize);
    let position = 0;
    for (let index = 0; index < entryCount; index++) {
      if (directory.readUInt32LE(position) !== DIRECTORY_ENTRY) throw new Error('Damaged ZIP directory');
      const method = directory.readUInt16LE(position + 10);
      const compressedSize = directory.readUInt32LE(position + 20);
      const uncompressedSize = directory.readUInt32LE(position + 24);
      const nameLength = directory.readUInt16LE(position + 28);
      const extraLength = directory.readUInt16LE(position + 30);
      const commentLength = directory.readUInt16LE(position + 32);
      const localOffset = directory.readUInt32LE(position + 42);
      const name = directory.toString('utf8', position + 46, position + 46 + nameLength);
      position += 46 + nameLength + extraLength + commentLength;
      if (name !== entryName) continue;

      if (uncompressedSize > maxSize || compressedSize > maxSize) throw new Error(`${entryName} is larger than expected`);
      // The local header repeats name and extra field, possibly with other lengths.
      const local = await read(localOffset, 30);
      if (local.readUInt32LE(0) !== LOCAL_HEADER) throw new Error('Damaged ZIP entry');
      const dataOffset = localOffset + 30 + local.readUInt16LE(26) + local.readUInt16LE(28);
      const data = await read(dataOffset, compressedSize);
      if (method === 0) return data;
      if (method === 8) return inflateRawSync(data, { maxOutputLength: maxSize });
      throw new Error(`Unsupported ZIP compression method ${method}`);
    }
    return null;
  } finally {
    await file.close();
  }
}
