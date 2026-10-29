import { useLayoutEffect, useRef } from 'react';
import { SkinViewer } from 'skinview3d';
import type { ThemeId } from '../../../shared/themes';
import { getDefaultSkin, loadDefaultSkin } from '../skin/defaultSkin';
import { createIdleAnimation } from '../skin/idleAnimation';
import { createPlaceholderSkin, readPlaceholderPalette } from '../skin/placeholderSkin';

// Size of the 3D view in CSS pixels; the canvas itself matches the screen's pixel density.
const WIDTH = 260;
const HEIGHT = 340;
// The calm idle motion looks the same at 30 frames per second and costs half as much as 60.
const FRAME_INTERVAL_MS = 1000 / 30;

interface SkinPreviewProps {
  /** Theme for the background and, without default skin, for the placeholder colours. */
  theme: ThemeId;
  /** Accessible description of the figure. */
  label: string;
}

const surfaceColor = () => getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim();

/** Minecraft's default skin if a version is installed, otherwise the placeholder in theme colours. */
const currentSkin = () => getDefaultSkin() ?? createPlaceholderSkin(readPlaceholderPalette());

/**
 * Animated 3D figure. Display only: no mouse controls, no rotating, no zooming.
 * The viewer is released when the component disappears (e.g. on another page),
 * so the 3D view only costs resources while it is visible.
 */
export default function SkinPreview({ theme, label }: SkinPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  // Theme the figure was last drawn for, so it is not drawn twice when the page opens.
  const drawnThemeRef = useRef<ThemeId | null>(null);

  // Layout effect: the first frame is drawn before the browser shows the page,
  // so the figure never pops in on an empty card.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    // skinview3d draws every screen frame (60 per second) unless paused; the loop below draws every second one.
    const viewer = new SkinViewer({
      canvas,
      width: WIDTH,
      height: HEIGHT,
      pixelRatio: 'match-device',
      enableControls: false,
      renderPaused: true,
      fov: 40,
      zoom: 0.82,
      background: surfaceColor(),
      skin: currentSkin(),
      model: 'default'
    });
    drawnThemeRef.current = theme;
    // Windows setting "Show animations" switched off: the figure stands still.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      viewer.animation = createIdleAnimation();
    }
    // The figure faces the viewer, like the player preview in the game.
    viewer.animation?.update(viewer.playerObject, 0);
    viewer.render();
    viewerRef.current = viewer;

    // Without a default skin yet (e.g. right after the first installation), ask again.
    let active = true;
    if (!getDefaultSkin()) {
      void loadDefaultSkin().then((skin) => {
        if (active && skin) viewer.loadSkin(skin, { model: 'default' });
      });
    }

    // requestAnimationFrame stops by itself while the window is minimized or hidden.
    let frameId = 0;
    let lastDraw = performance.now();
    const loop = (now: number) => {
      frameId = requestAnimationFrame(loop);
      const elapsed = now - lastDraw;
      if (elapsed < FRAME_INTERVAL_MS - 1) {
        return;
      }
      lastDraw = now;
      viewer.animation?.update(viewer.playerObject, elapsed / 1000);
      viewer.render();
    };
    frameId = requestAnimationFrame(loop);

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
      viewer.dispose();
      viewerRef.current = null;
    };
  }, []);

  // A theme change while the figure is visible: new background and, if shown, new placeholder colours.
  useLayoutEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || drawnThemeRef.current === theme) {
      return;
    }
    drawnThemeRef.current = theme;
    viewer.background = surfaceColor();
    if (!getDefaultSkin()) {
      viewer.loadSkin(createPlaceholderSkin(readPlaceholderPalette()), { model: 'default' });
    }
  }, [theme]);

  return <canvas ref={canvasRef} className="skin-preview" role="img" aria-label={label} />;
}
