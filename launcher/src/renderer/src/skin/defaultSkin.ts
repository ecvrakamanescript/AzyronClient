// Minecraft's default skin (Steve), read by the main process from an installed version.
// It is kept as a decoded image, so the 3D view can draw it in its very first frame.

let image: HTMLImageElement | null = null;
let loading: Promise<HTMLImageElement | null> | null = null;

/** Loads the default skin once; tries again on the next call while no version is installed. */
export function loadDefaultSkin(): Promise<HTMLImageElement | null> {
  if (image) {
    return Promise.resolve(image);
  }
  loading ??= window.azyron.skins
    .getDefault()
    .then(async (url) => {
      if (!url) return null;
      const loaded = new Image();
      loaded.src = url;
      await loaded.decode();
      image = loaded;
      return loaded;
    })
    .catch(() => null)
    .finally(() => {
      loading = null;
    });
  return loading;
}

/** The default skin if it is already loaded, otherwise null. */
export function getDefaultSkin(): HTMLImageElement | null {
  return image;
}
