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
}
