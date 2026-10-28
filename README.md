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

## Development

Requirements and setup instructions will follow in [`docs/`](docs/) once Phase 1 starts.

## License

Azyron Client is licensed under the [GNU General Public License v3.0](LICENSE).

## Disclaimer

**NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.**

Azyron Client is an independent open-source project. The project author, not Mojang or Microsoft, is responsible for the launcher and the client. The launcher downloads all game files directly from Mojang's official servers; Minecraft files or modified versions of the game are not redistributed. The client is distributed as a mod only.

## Contact

Questions and reports: azyronclient@proton.me
