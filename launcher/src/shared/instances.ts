/** An instance: a named game setup with its own folder (worlds, settings, screenshots). */
export interface Instance {
  /** Random UUID; also the name of the instance folder. */
  id: string;
  name: string;
  versionId: string;
  /** ISO date of creation. */
  createdAt: string;
}

export const INSTANCE_NAME_MAX_LENGTH = 40;

/** Trimmed name, or null if it is empty, too long or contains control characters. */
export function normalizeInstanceName(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const name = raw.trim();
  // Control characters (U+0000 to U+001F and U+007F) are not allowed in names.
  const hasControl = [...name].some((char) => {
    const code = char.charCodeAt(0);
    return code < 0x20 || code === 0x7f;
  });
  return name.length > 0 && name.length <= INSTANCE_NAME_MAX_LENGTH && !hasControl ? name : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isInstanceId(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}
