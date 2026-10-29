import type { InstallState, InstallStateEvent } from './install';
import type { Instance } from './instances';
import type { LaunchCheck } from './launch';
import type { Settings, SettingsChange } from './settings';
import type { VersionList } from './versions';

/**
 * Functions and data the preload script exposes to the renderer as `window.azyron`.
 * The renderer has no direct access to Node.js or Electron; everything goes through this API.
 */
export interface AzyronApi {
  readonly versions: {
    readonly electron: string;
    readonly chrome: string;
    readonly node: string;
  };
  readonly app: {
    /** Launcher version from package.json. */
    getVersion(): Promise<string>;
  };
  /** Controls for the frameless main window (own title bar). */
  readonly window: {
    minimize(): void;
    toggleMaximize(): void;
    close(): void;
    isMaximized(): Promise<boolean>;
    /** Calls the listener whenever the window is maximized or restored. Returns a function to unsubscribe. */
    onMaximizedChange(listener: (maximized: boolean) => void): () => void;
  };
  /** Launcher settings, stored by the main process. */
  readonly settings: {
    get(): Promise<Settings>;
    /** Saves the given fields and returns the complete new settings. Rejects invalid values. */
    set(change: SettingsChange): Promise<Settings>;
  };
  /** Minecraft versions from Mojang's manifest (loaded by the main process). */
  readonly gameVersions: {
    list(includeSnapshots: boolean): Promise<VersionList>;
  };
  /** Instances (game setups with their own folder), stored by the main process. */
  readonly instances: {
    list(): Promise<Instance[]>;
    create(name: string, versionId: string): Promise<Instance>;
    rename(id: string, name: string): Promise<Instance>;
    /** Deletes the instance together with its folder (worlds, settings, screenshots). */
    remove(id: string): Promise<void>;
    /** Opens the instance folder in Windows Explorer. */
    openFolder(id: string): Promise<void>;
  };
  /** Downloads of Minecraft versions; one installation is shared by all instances of a version. */
  readonly install: {
    getStates(versionIds: string[]): Promise<Record<string, InstallState>>;
    /** Starts the installation in the background; the state arrives through onStateChange. */
    start(versionId: string): Promise<void>;
    cancel(versionId: string): Promise<void>;
    /** Calls the listener on every change of an installation. Returns a function to unsubscribe. */
    onStateChange(listener: (event: InstallStateEvent) => void): () => void;
  };
  /** Starting the game. Until the Microsoft sign-in exists, only the check is available. */
  readonly launch: {
    /** Checks files and Java of an instance without starting the game. */
    check(instanceId: string): Promise<LaunchCheck>;
  };
  readonly skins: {
    /** Minecraft's default skin (Steve) as a PNG data URL from an installed version, or null. */
    getDefault(): Promise<string | null>;
  };
}
