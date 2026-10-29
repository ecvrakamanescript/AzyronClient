# Azyron Client

A free Minecraft: Java Edition client with its own launcher for Windows.

> **Status:** In development, not ready for use yet. There is no release.

## Current state

- **Launcher:** main window with dark, light and AMOLED black themes, English and German, list of Minecraft versions from 1.21, instances, installation of a version including the matching Java runtime from Mojang's servers. Microsoft sign-in and starting the game are not available yet; they need Mojang's approval of the launcher's sign-in, which is pending.
- **Client:** builds for Minecraft 26.3 and 1.21.11, module system, configuration file, in-game menu on Right Shift, and the base for a new menu and HUD in the launcher's style that stays sharp up to 4K. The first HUD modules are next.

## Overview

| Part | Technology | Folder |
|---|---|---|
| Launcher | Electron, TypeScript | `launcher/` |
| Client core (version-independent) | Java | `client/core/` |
| Client, modern versions (currently 26.3 and 1.21.11; planned: 1.21 up to the latest snapshot) | Fabric, Stonecutter | `client/modern/` |
| Client, 1.8.9 | Legacy Fabric or Forge (decision pending) | `client/legacy-1.8.9/` |
| Cosmetics server (later) | to be decided | `backend/` |
| Documentation | Markdown | `docs/` |

## Planned features

- Launcher: Microsoft sign-in, instance and version management, automatic Java runtime, Modrinth integration, server list, skin management, themes (dark with purple accent by default), German and English
- Client: HUD (FPS, coordinates, CPS, ping, keystrokes, armor, effects), PvP comfort features, performance optimizations, local cosmetics, in-game client menu (Right Shift)

No cheat features. Only features that are commonly allowed on servers will be implemented.

## Launcher only, open source

Azyron Client is launcher-only: the client is installed, updated and started exclusively by the Azyron Client launcher. It is not offered as a mod for other launchers.

At the same time, Azyron Client is fully open source. The complete source code of the launcher and the client is in this repository under the GPL-3.0, so anyone can read, review and build it.

## Development

Requirements: Windows, [Git](https://git-scm.com/), [Node.js](https://nodejs.org/) 24 LTS, and the JDKs 21 and 25 (for example [Eclipse Temurin](https://adoptium.net/)).

Launcher (in `launcher/`):

```
npm install
npm run dev
npm test
```

`npm run dev` starts the launcher with hot reload, `npm run build` checks the types and builds it.

Client (in `client/`):

```
.\gradlew.bat build
.\gradlew.bat :modern:26.3:runClient
```

`build` runs the tests and builds the client for every supported Minecraft version. `runClient` starts Minecraft with the client for local development; use `:modern:1.21.11:runClient` for 1.21.11. Gradle downloads the game files from Mojang's servers.

## License

Azyron Client is licensed under the [GNU General Public License v3.0](LICENSE).

The client includes the [Inter](https://github.com/rsms/inter) font (version 4.1, unmodified), which is licensed separately under the [SIL Open Font License 1.1](client/modern/src/main/resources/licenses/Inter-OFL.txt).

## Disclaimer

**NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.**

Azyron Client is an independent open-source project. The project author, not Mojang or Microsoft, is responsible for the launcher and the client. The launcher downloads all game files directly from Mojang's official servers; Minecraft files or modified versions of the game are not redistributed. The client is loaded at runtime when the launcher starts the game, and it is only available through the Azyron Client launcher.

## Contact

Questions and reports: azyronclient@proton.me
