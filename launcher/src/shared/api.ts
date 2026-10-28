import type { Settings, SettingsChange } from './settings';

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
}
