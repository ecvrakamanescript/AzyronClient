import { readFileSync } from 'node:fs';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { app, ipcMain } from 'electron';
import { IpcChannels } from '../shared/ipc';
import { defaultSettings, normalizeSettings, validateSettingsChange, type Settings } from '../shared/settings';

let current: Settings = defaultSettings;
// Writes run one after another, so an older state can never overwrite a newer one.
let writeQueue: Promise<void> = Promise.resolve();

function settingsPath(): string {
  return join(app.getPath('userData'), 'settings.json');
}

/** Reads settings.json once at startup. A missing or damaged file gives the defaults. */
export function loadSettings(): Settings {
  const file = settingsPath();
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    // No file yet (first start): defaults, the file is created on the first change.
    current = defaultSettings;
    return current;
  }
  try {
    // Editors like Notepad may add a byte order mark, which JSON.parse does not accept.
    current = normalizeSettings(JSON.parse(text.replace(/^﻿/, '')));
  } catch {
    console.warn(`Settings file ${file} is not valid JSON; using defaults.`);
    current = defaultSettings;
  }
  return current;
}

export function getSettings(): Settings {
  return current;
}

// Write to a temporary file first and then replace the real one,
// so a crash during writing never leaves a half-written settings.json.
async function writeSettings(settings: Settings): Promise<void> {
  const file = settingsPath();
  const temp = `${file}.tmp`;
  await mkdir(dirname(file), { recursive: true });
  await writeFile(temp, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
  await rename(temp, file);
}

/**
 * Registers the IPC handlers behind window.azyron.settings. Call once at startup.
 * onChange runs after every accepted change (e.g. to update the window background).
 */
export function registerSettingsHandlers(onChange: (settings: Settings) => void): void {
  ipcMain.handle(IpcChannels.settingsGet, () => current);

  ipcMain.handle(IpcChannels.settingsSet, async (_event, raw: unknown) => {
    // The renderer is not trusted blindly: unknown fields or values are rejected.
    const change = validateSettingsChange(raw);
    if (!change) {
      throw new Error('Invalid settings change');
    }
    current = { ...current, ...change };
    onChange(current);

    const snapshot = current;
    writeQueue = writeQueue
      .then(() => writeSettings(snapshot))
      .catch((error: unknown) => {
        // The change stays active for this session even if it could not be saved.
        console.error('Could not save settings:', error);
      });
    await writeQueue;
    return current;
  });
}
