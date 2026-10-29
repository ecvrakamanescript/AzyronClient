import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { testVersion } from './__fixtures__/version';
import { createGamePaths } from './paths';
import { rulesAllow, toWindowsArch, type RuleEnvironment } from './rules';
import { gameFileTasks, isVersionJson, selectLibraries } from './versionJson';

const x64: RuleEnvironment = { arch: 'x64', osVersion: '10.0.19044', features: {} };
const arm64: RuleEnvironment = { ...x64, arch: 'arm64' };

describe('rulesAllow', () => {
  it('allows everything without rules', () => {
    expect(rulesAllow(undefined, x64)).toBe(true);
    expect(rulesAllow([], x64)).toBe(true);
  });

  it('checks the operating system and the last matching rule wins', () => {
    expect(rulesAllow([{ action: 'allow', os: { name: 'windows' } }], x64)).toBe(true);
    expect(rulesAllow([{ action: 'allow', os: { name: 'osx' } }], x64)).toBe(false);
    expect(rulesAllow([{ action: 'allow' }, { action: 'disallow', os: { name: 'windows' } }], x64)).toBe(false);
  });

  it('treats arch x86 as 32-bit only', () => {
    expect(rulesAllow([{ action: 'allow', os: { arch: 'x86' } }], x64)).toBe(false);
    expect(rulesAllow([{ action: 'allow', os: { arch: 'x86' } }], { ...x64, arch: 'x86' })).toBe(true);
  });

  it('checks the OS version as a regular expression', () => {
    expect(rulesAllow([{ action: 'allow', os: { version: '^10\\.' } }], x64)).toBe(true);
    expect(rulesAllow([{ action: 'allow', os: { version: '^6\\.1' } }], x64)).toBe(false);
  });

  it('checks features, missing ones count as false', () => {
    const rule = [{ action: 'allow' as const, features: { has_custom_resolution: true } }];
    expect(rulesAllow(rule, x64)).toBe(false);
    expect(rulesAllow(rule, { ...x64, features: { has_custom_resolution: true } })).toBe(true);
  });
});

describe('toWindowsArch', () => {
  it('maps Node architectures', () => {
    expect(toWindowsArch('x64')).toBe('x64');
    expect(toWindowsArch('arm64')).toBe('arm64');
    expect(toWindowsArch('ia32')).toBe('x86');
  });
});

describe('selectLibraries', () => {
  const names = (env: RuleEnvironment) => selectLibraries(testVersion, env).map((library) => library.name);

  it('keeps common libraries and the natives for this processor', () => {
    expect(names(x64)).toEqual(['com.example:common:1.0', 'org.lwjgl:lwjgl:3.4.3', 'org.lwjgl:lwjgl:3.4.3:natives-windows']);
    expect(names(arm64)).toEqual(['com.example:common:1.0', 'org.lwjgl:lwjgl:3.4.3', 'org.lwjgl:lwjgl:3.4.3:natives-windows-arm64']);
  });

  it('rejects the old natives format', () => {
    const old = { ...testVersion, libraries: [{ name: 'org.lwjgl.lwjgl:lwjgl-platform:2.9.4', natives: { windows: 'natives-windows' } }] };
    expect(() => selectLibraries(old, x64)).toThrow('old natives format');
  });
});

describe('gameFileTasks', () => {
  const paths = createGamePaths('C:\\game');
  const assets = {
    objects: {
      'minecraft/sounds/a.ogg': { hash: 'aa'.repeat(20), size: 5 },
      'minecraft/sounds/same.ogg': { hash: 'aa'.repeat(20), size: 5 },
      'minecraft/lang/de_ch.json': { hash: 'bb'.repeat(20), size: 7 },
      'broken': { hash: '../../x', size: 1 }
    }
  };

  it('lists client, libraries, logging configuration and each asset object once', () => {
    const tasks = gameFileTasks(paths, testVersion, assets, x64);
    expect(tasks.map((task) => task.path)).toEqual([
      join('C:\\game', 'versions', '26.3', '26.3.jar'),
      join('C:\\game', 'libraries', 'com', 'example', 'common', '1.0', 'common-1.0.jar'),
      join('C:\\game', 'libraries', 'org', 'lwjgl', 'lwjgl', '3.4.3', 'lwjgl-3.4.3.jar'),
      join('C:\\game', 'libraries', 'org', 'lwjgl', 'lwjgl', '3.4.3', 'lwjgl-3.4.3-natives-windows.jar'),
      join('C:\\game', 'assets', 'log_configs', 'client-1.21.2.xml'),
      join('C:\\game', 'assets', 'objects', 'aa', 'aa'.repeat(20)),
      join('C:\\game', 'assets', 'objects', 'bb', 'bb'.repeat(20))
    ]);
    expect(tasks.at(-1)?.url).toBe(`https://resources.download.minecraft.net/bb/${'bb'.repeat(20)}`);
  });
});

describe('isVersionJson', () => {
  it('accepts the expected format and rejects others', () => {
    expect(isVersionJson(testVersion)).toBe(true);
    expect(isVersionJson({ ...testVersion, arguments: undefined })).toBe(false);
    expect(isVersionJson(null)).toBe(false);
  });
});
