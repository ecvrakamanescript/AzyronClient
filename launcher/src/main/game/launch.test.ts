import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { testVersion } from './__fixtures__/version';
import { buildLaunchCommand, redactCommand, type LaunchOptions } from './launch';
import { createGamePaths } from './paths';

const paths = createGamePaths('C:\\game');
const options: LaunchOptions = {
  paths,
  version: testVersion,
  env: { arch: 'x64', osVersion: '10.0.19044', features: {} },
  gameDirectory: 'C:\\game\\instances\\abc',
  account: { name: 'Player', uuid: '00000000000000000000000000000000', accessToken: 'secret-token', xuid: '123' },
  launcherVersion: '0.1.0'
};

const valueAfter = (args: string[], flag: string) => args[args.indexOf(flag) + 1];

describe('buildLaunchCommand', () => {
  const command = buildLaunchCommand(options);

  it('starts javaw.exe of the required runtime in the instance folder', () => {
    expect(command.executable).toBe(join('C:\\game', 'runtimes', 'java-runtime-epsilon', 'bin', 'javaw.exe'));
    expect(command.cwd).toBe('C:\\game\\instances\\abc');
  });

  it('puts memory, JVM arguments, logging and main class before the game arguments', () => {
    const main = command.args.indexOf('net.minecraft.client.main.Main');
    expect(command.args[0]).toBe('-Xmx2048M');
    expect(command.args.indexOf('-cp')).toBeLessThan(main);
    expect(command.args[main - 1]).toBe(`-Dlog4j.configurationFile=${join('C:\\game', 'assets', 'log_configs', 'client-1.21.2.xml')}`);
    expect(command.args[main + 1]).toBe('--username');
  });

  it('applies the rules for Windows on x64', () => {
    expect(command.args).toContain('-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump');
    expect(command.args).not.toContain('-XstartOnFirstThread');
    expect(command.args).not.toContain('-Xss1M');
    expect(command.args).not.toContain('--demo');
    expect(command.args).not.toContain('--width');
  });

  it('fills in the placeholders', () => {
    expect(valueAfter(command.args, '--username')).toBe('Player');
    expect(valueAfter(command.args, '--version')).toBe('26.3');
    expect(valueAfter(command.args, '--gameDir')).toBe('C:\\game\\instances\\abc');
    expect(valueAfter(command.args, '--assetsDir')).toBe(join('C:\\game', 'assets'));
    expect(valueAfter(command.args, '--assetIndex')).toBe('34');
    expect(valueAfter(command.args, '--accessToken')).toBe('secret-token');
    expect(valueAfter(command.args, '--versionType')).toBe('release');
    expect(command.args).toContain(`-Djava.library.path=${join('C:\\game', 'versions', '26.3', 'natives')}/java`);
    expect(command.args).toContain('-Dminecraft.launcher.brand=azyron-client');
    expect(command.args.join(' ')).not.toMatch(/\$\{(?!clientid)/);
  });

  it('builds the classpath from the libraries for this computer and the client jar', () => {
    const entries = valueAfter(command.args, '-cp')!.split(';');
    expect(entries).toEqual([
      join('C:\\game', 'libraries', 'com', 'example', 'common', '1.0', 'common-1.0.jar'),
      join('C:\\game', 'libraries', 'org', 'lwjgl', 'lwjgl', '3.4.3', 'lwjgl-3.4.3.jar'),
      join('C:\\game', 'libraries', 'org', 'lwjgl', 'lwjgl', '3.4.3', 'lwjgl-3.4.3-natives-windows.jar'),
      join('C:\\game', 'versions', '26.3', '26.3.jar')
    ]);
  });

  it('adds the window size only when one is set', () => {
    const sized = buildLaunchCommand({ ...options, resolution: { width: 1280, height: 720 } });
    expect(valueAfter(sized.args, '--width')).toBe('1280');
    expect(valueAfter(sized.args, '--height')).toBe('720');
  });
});

describe('redactCommand', () => {
  it('hides the access token', () => {
    const redacted = redactCommand(buildLaunchCommand(options).args, 'secret-token');
    expect(redacted.join(' ')).not.toContain('secret-token');
    expect(valueAfter(redacted, '--accessToken')).toBe('<access token>');
  });
});
