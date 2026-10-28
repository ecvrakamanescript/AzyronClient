// Placeholder skin shown while no account is signed in.
// It is drawn at runtime in the standard 64x64 skin layout from the theme colours,
// so the launcher ships no skin image (the Minecraft default skins belong to Mojang).

type Rgb = readonly [number, number, number];
type Face = 'top' | 'bottom' | 'right' | 'front' | 'left' | 'back';
type PartName = 'head' | 'body' | 'arm' | 'leg';

/** Position of a body part in the skin file: texture origin (u, v) and box size. */
interface Part {
  name: PartName;
  u: number;
  v: number;
  width: number;
  height: number;
  depth: number;
}

// Base layer of the classic (4 px arms) 64x64 layout. The outer layer stays transparent.
const parts: readonly Part[] = [
  { name: 'head', u: 0, v: 0, width: 8, height: 8, depth: 8 },
  { name: 'body', u: 16, v: 16, width: 8, height: 12, depth: 4 },
  { name: 'arm', u: 40, v: 16, width: 4, height: 12, depth: 4 },
  { name: 'arm', u: 32, v: 48, width: 4, height: 12, depth: 4 },
  { name: 'leg', u: 0, v: 16, width: 4, height: 12, depth: 4 },
  { name: 'leg', u: 16, v: 48, width: 4, height: 12, depth: 4 }
];

// Light comes from above: top faces brighter, bottom faces darker.
const faceShade: Readonly<Record<Face, number>> = {
  top: 1.1,
  front: 1,
  right: 0.92,
  left: 0.92,
  back: 0.86,
  bottom: 0.78
};

export interface PlaceholderPalette {
  skin: Rgb;
  shirt: Rgb;
  pants: Rgb;
  shoes: Rgb;
  eyes: Rgb;
}

function parseHex(value: string): Rgb {
  const hex = value.trim().replace('#', '');
  const channel = (start: number) => parseInt(hex.slice(start, start + 2), 16);
  return [channel(0), channel(2), channel(4)];
}

function mix(a: Rgb, b: Rgb, amount: number): Rgb {
  const channel = (i: 0 | 1 | 2) => Math.round(a[i] + (b[i] - a[i]) * amount);
  return [channel(0), channel(1), channel(2)];
}

/** Derives the placeholder colours from the active theme (hex variables in theme.css). */
export function readPlaceholderPalette(): PlaceholderPalette {
  const style = getComputedStyle(document.documentElement);
  const color = (name: string) => parseHex(style.getPropertyValue(name));
  const text = color('--color-text');
  const muted = color('--color-text-muted');
  const accent = color('--color-accent');
  const bg = color('--color-bg');
  return {
    skin: mix(muted, text, 0.35),
    shirt: accent,
    pants: mix(accent, bg, 0.55),
    shoes: mix(muted, bg, 0.5),
    eyes: bg
  };
}

/** Colour of one pixel; row counts from the top of the side faces. */
function pixelColor(part: PartName, face: Face, row: number, column: number, palette: PlaceholderPalette): Rgb {
  switch (part) {
    case 'head':
      // Two small eyes, so the front of the figure is recognisable.
      return face === 'front' && row === 4 && (column === 1 || column === 2 || column === 5 || column === 6)
        ? palette.eyes
        : palette.skin;
    case 'body':
      return palette.shirt;
    case 'arm':
      // Short sleeves in the shirt colour.
      if (face === 'top') return palette.shirt;
      if (face === 'bottom') return palette.skin;
      return row < 4 ? palette.shirt : palette.skin;
    case 'leg':
      if (face === 'top') return palette.pants;
      if (face === 'bottom') return palette.shoes;
      return row >= 9 ? palette.shoes : palette.pants;
  }
}

// Same pattern for every call, so the texture does not flicker when it is redrawn.
function noise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return (n - Math.floor(n)) * 0.06 - 0.03;
}

/** Draws the placeholder skin; the canvas can be passed directly to skinview3d. */
export function createPlaceholderSkin(palette: PlaceholderPalette): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (!context) {
    return canvas;
  }
  const image = context.createImageData(64, 64);

  for (const part of parts) {
    const { u, v, width: w, height: h, depth: d } = part;
    // Face rectangles of a box in the skin layout.
    const faces: readonly [Face, number, number, number, number][] = [
      ['top', u + d, v, w, d],
      ['bottom', u + d + w, v, w, d],
      ['right', u, v + d, d, h],
      ['front', u + d, v + d, w, h],
      ['left', u + d + w, v + d, d, h],
      ['back', u + d + w + d, v + d, w, h]
    ];
    for (const [face, x0, y0, fw, fh] of faces) {
      for (let y = y0; y < y0 + fh; y++) {
        for (let x = x0; x < x0 + fw; x++) {
          const base = pixelColor(part.name, face, y - y0, x - x0, palette);
          const shade = faceShade[face] + noise(x, y);
          const offset = (y * 64 + x) * 4;
          image.data[offset] = Math.min(255, base[0] * shade);
          image.data[offset + 1] = Math.min(255, base[1] * shade);
          image.data[offset + 2] = Math.min(255, base[2] * shade);
          image.data[offset + 3] = 255;
        }
      }
    }
  }

  context.putImageData(image, 0, 0);
  return canvas;
}
