# Azyron Client

A free Minecraft: Java Edition client with its own launcher for Windows.

> **Status:** Phase 0 – preparation. There is no working code yet.

## Overview

| Part | Technology | Folder |
|---|---|---|
| Launcher | Electron, TypeScript | `launcher/` |
| Client core (version-independent) | Java | `client/core/` |
| Client, modern versions (1.21 up to the latest snapshot) | Fabric, Stonecutter | `client/modern/` |
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

Requirements and setup instructions will follow in [`docs/`](docs/) once Phase 1 starts.

## License

Azyron Client is licensed under the [GNU General Public License v3.0](LICENSE).

The client includes the [Inter](https://github.com/rsms/inter) font (version 4.1, unmodified), which is licensed separately under the [SIL Open Font License 1.1](client/modern/src/main/resources/licenses/Inter-OFL.txt).

## Disclaimer

**NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.**

Azyron Client is an independent open-source project. The project author, not Mojang or Microsoft, is responsible for the launcher and the client. The launcher downloads all game files directly from Mojang's official servers; Minecraft files or modified versions of the game are not redistributed. The client is loaded at runtime when the launcher starts the game, and it is only available through the Azyron Client launcher.

## Contact

Questions and reports: azyronclient@proton.me
