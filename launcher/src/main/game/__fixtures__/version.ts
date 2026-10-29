import type { VersionJson } from '../versionJson';

// Hand-written version file in Mojang's format for the tests (not a Mojang file).
// It contains the cases that matter: rules per system and processor, natives,
// feature rules and a logging configuration.

const file = (name: string) => ({
  url: `https://libraries.minecraft.net/${name}`,
  sha1: name.padEnd(40, '0').slice(0, 40).replace(/[^0-9a-f]/g, 'a'),
  size: 100
});

const library = (name: string, path: string, rules?: VersionJson['libraries'][number]['rules']) => ({
  name,
  downloads: { artifact: { ...file(path), path } },
  ...(rules ? { rules } : {})
});

export const testVersion: VersionJson = {
  id: '26.3',
  type: 'release',
  mainClass: 'net.minecraft.client.main.Main',
  assets: '34',
  assetIndex: {
    id: '34',
    url: 'https://piston-meta.mojang.com/v1/packages/abc/34.json',
    sha1: 'b'.repeat(40),
    size: 50,
    totalSize: 300
  },
  downloads: { client: { url: 'https://piston-data.mojang.com/v1/objects/abc/client.jar', sha1: 'c'.repeat(40), size: 1000 } },
  javaVersion: { component: 'java-runtime-epsilon', majorVersion: 25 },
  libraries: [
    library('com.example:common:1.0', 'com/example/common/1.0/common-1.0.jar'),
    library('org.lwjgl:lwjgl:3.4.3', 'org/lwjgl/lwjgl/3.4.3/lwjgl-3.4.3.jar'),
    library('org.lwjgl:lwjgl:3.4.3:natives-windows', 'org/lwjgl/lwjgl/3.4.3/lwjgl-3.4.3-natives-windows.jar', [
      { action: 'allow', os: { name: 'windows' } }
    ]),
    library('org.lwjgl:lwjgl:3.4.3:natives-windows-arm64', 'org/lwjgl/lwjgl/3.4.3/lwjgl-3.4.3-natives-windows-arm64.jar', [
      { action: 'allow', os: { name: 'windows' } }
    ]),
    library('org.lwjgl:lwjgl:3.4.3:natives-linux', 'org/lwjgl/lwjgl/3.4.3/lwjgl-3.4.3-natives-linux.jar', [
      { action: 'allow', os: { name: 'linux' } }
    ]),
    library('com.example:not-on-windows:1.0', 'com/example/not-on-windows/1.0/not-on-windows-1.0.jar', [
      { action: 'allow' },
      { action: 'disallow', os: { name: 'windows' } }
    ])
  ],
  arguments: {
    game: [
      '--username',
      '${auth_player_name}',
      '--version',
      '${version_name}',
      '--gameDir',
      '${game_directory}',
      '--assetsDir',
      '${assets_root}',
      '--assetIndex',
      '${assets_index_name}',
      '--uuid',
      '${auth_uuid}',
      '--accessToken',
      '${auth_access_token}',
      '--clientId',
      '${clientid}',
      '--xuid',
      '${auth_xuid}',
      '--versionType',
      '${version_type}',
      { rules: [{ action: 'allow', features: { is_demo_user: true } }], value: '--demo' },
      {
        rules: [{ action: 'allow', features: { has_custom_resolution: true } }],
        value: ['--width', '${resolution_width}', '--height', '${resolution_height}']
      }
    ],
    jvm: [
      { rules: [{ action: 'allow', os: { name: 'osx' } }], value: ['-XstartOnFirstThread'] },
      {
        rules: [{ action: 'allow', os: { name: 'windows' } }],
        value: '-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump'
      },
      { rules: [{ action: 'allow', os: { arch: 'x86' } }], value: '-Xss1M' },
      '-Djava.library.path=${natives_directory}/java',
      '-Dminecraft.launcher.brand=${launcher_name}',
      '-Dminecraft.launcher.version=${launcher_version}',
      '-cp',
      '${classpath}'
    ]
  },
  logging: {
    client: {
      argument: '-Dlog4j.configurationFile=${path}',
      file: { id: 'client-1.21.2.xml', url: 'https://piston-data.mojang.com/v1/objects/def/client-1.21.2.xml', sha1: 'd'.repeat(40), size: 10 }
    }
  }
};
