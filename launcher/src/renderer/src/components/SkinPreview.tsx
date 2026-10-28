import { useEffect, useRef } from 'react';
import { SkinViewer } from 'skinview3d';
import type { ThemeId } from '../../../shared/themes';
import { createIdleAnimation } from '../skin/idleAnimation';
import { createPlaceholderSkin, readPlaceholderPalette } from '../skin/placeholderSkin';

// Size of the 3D view in CSS pixels; the canvas itself matches the screen's pixel density.
const WIDTH = 260;
const HEIGHT = 340;
// The calm idle motion looks the same at 30 frames per second and costs half as much as 60.
const FRAME_INTERVAL_MS = 1000 / 30;

interface SkinPreviewProps {
  /** Redraws the placeholder and the background in the colours of this theme. */
  theme: ThemeId;
  /** Accessible description of the figure. */
  label: string;
}

/**
 * Animated 3D figure. Display only: no mouse controls, no rotating, no zooming.
 * The viewer is released when the component disappears (e.g. on another page),
 * so the 3D view only costs resources while it is visible.
 */
export default function SkinPreview({ theme, label }: SkinPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const viewer = new SkinViewer({
      canvas,
      width: WIDTH,
      height: HEIGHT,
      pixelRatio: 'match-device',
      enableControls: false,
      fov: 40,
      zoom: 0.82
    });
    // Turned and seen slightly from above, so the figure looks three-dimensional.
    // The positive angle brings the waving (right) arm towards the viewer.
    viewer.playerObject.rotation.y = 0.55;
    viewer.playerWrapper.rotation.x = 0.12;
    // Windows setting "Show animations" switched off: the figure stands still.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      viewer.animation = createIdleAnimation();
    }
    viewerRef.current = viewer;

    // skinview3d draws every screen frame (60 per second); our own loop draws every second one.
    // requestAnimationFrame stops by itself while the window is minimized or hidden.
    viewer.renderPaused = true;
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
      cancelAnimationFrame(frameId);
      viewer.dispose();
      viewerRef.current = null;
    };
  }, []);

  // Runs after the viewer exists and again on every theme change.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) {
      return;
    }
    viewer.background = getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim();
    viewer.loadSkin(createPlaceholderSkin(readPlaceholderPalette()), { model: 'default' });
  }, [theme]);

  return <canvas ref={canvasRef} className="skin-preview" role="img" aria-label={label} />;
}
