import { useLayoutEffect, useRef } from 'react';
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
const surfaceColor = () => getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim();

export default function SkinPreview({ theme, label }: SkinPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<SkinViewer | null>(null);
  // Theme the placeholder was last drawn for, so it is not drawn twice when the page opens.
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
      skin: createPlaceholderSkin(readPlaceholderPalette()),
      model: 'default'
    });
    drawnThemeRef.current = theme;
    // Windows setting "Show animations" switched off: the figure stands still.
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      viewer.animation = createIdleAnimation();
    }
    // Turned and seen slightly from above, so the figure looks three-dimensional; the positive
    // angle brings the waving (right) arm towards the viewer. Set on the wrapper, because
    // skinview3d resets the rotation of playerObject whenever an animation is set.
    viewer.playerWrapper.rotation.set(0.12, 0.55, 0);
    viewer.animation?.update(viewer.playerObject, 0);
    viewer.render();
    viewerRef.current = viewer;

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
      cancelAnimationFrame(frameId);
      viewer.dispose();
      viewerRef.current = null;
    };
  }, []);

  // A theme change while the figure is visible: redraw placeholder and background.
  useLayoutEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || drawnThemeRef.current === theme) {
      return;
    }
    drawnThemeRef.current = theme;
    viewer.background = surfaceColor();
    viewer.loadSkin(createPlaceholderSkin(readPlaceholderPalette()), { model: 'default' });
  }, [theme]);

  return <canvas ref={canvasRef} className="skin-preview" role="img" aria-label={label} />;
}
