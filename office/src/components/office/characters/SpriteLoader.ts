import * as THREE from 'three';

// 스프라이트 시트 규격
// 각 PNG: 112x96 (7프레임 x 16px wide, 3방향 x 32px tall)
// Row 0=down, Row 1=up, Row 2=right. Left=flipped right.

export type Direction = 'down' | 'up' | 'right';
export type Action = 'walk' | 'type' | 'read';

export interface FrameInfo {
  direction: Direction;
  action: Action;
  frameIndex: number;
}

// 액션별 프레임 매핑 (col index 0-based)
// walk1=0, walk2=1, walk3=2, type1=3, type2=4, read1=5, read2=6
const ACTION_FRAMES: Record<Action, number[]> = {
  walk: [0, 1, 2],
  type: [3, 4],
  read: [5, 6],
};

const DIRECTION_ROWS: Record<Direction, number> = {
  down: 0,
  up: 1,
  right: 2,
};

const FRAME_W = 16;
const FRAME_H = 32;

export interface SpriteSheet {
  /** getTexture(direction, action, frameIndex) → THREE.CanvasTexture */
  getTexture(direction: Direction, action: Action, frameIndex: number): THREE.CanvasTexture;
  getFrameCount(action: Action): number;
  dispose(): void;
}

/** 단일 PNG 이미지에서 SpriteSheet 생성 (hueShift 지원) */
function buildSpriteSheet(img: HTMLImageElement, hueShift: number): SpriteSheet {
  const cache = new Map<string, THREE.CanvasTexture>();

  function extractFrame(row: number, col: number): THREE.CanvasTexture {
    const key = `${row}:${col}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = FRAME_W;
    canvas.height = FRAME_H;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, col * FRAME_W, row * FRAME_H, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);

    if (hueShift !== 0) {
      applyHueShift(ctx, FRAME_W, FRAME_H, hueShift);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    cache.set(key, texture);
    return texture;
  }

  return {
    getTexture(direction: Direction, action: Action, frameIndex: number): THREE.CanvasTexture {
      const row = DIRECTION_ROWS[direction];
      const frames = ACTION_FRAMES[action];
      const col = frames[frameIndex % frames.length];
      return extractFrame(row, col);
    },
    getFrameCount(action: Action): number {
      return ACTION_FRAMES[action].length;
    },
    dispose() {
      cache.forEach((t) => t.dispose());
      cache.clear();
    },
  };
}

/** HSL 색상 시프트를 픽셀 단위로 적용 */
function applyHueShift(ctx: CanvasRenderingContext2D, w: number, h: number, shift: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a === 0) continue; // 투명 픽셀 건너뜀

    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    const [h, s, l] = rgbToHsl(r, g, b);
    const newH = (h + shift / 360 + 1) % 1;
    const [nr, ng, nb] = hslToRgb(newH, s, l);

    data[i] = Math.round(nr * 255);
    data[i + 1] = Math.round(ng * 255);
    data[i + 2] = Math.round(nb * 255);
  }

  ctx.putImageData(imageData, 0, 0);
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hue2rgb(h + 1 / 3), hue2rgb(h), hue2rgb(h - 1 / 3)];
}

// 전역 캐시: `palette:hueShift` → Promise<SpriteSheet>
const sheetCache = new Map<string, Promise<SpriteSheet>>();

export function loadSpriteSheet(palette: number, hueShift: number): Promise<SpriteSheet> {
  const key = `${palette}:${hueShift}`;
  const cached = sheetCache.get(key);
  if (cached) return cached;

  const promise = new Promise<SpriteSheet>((resolve, reject) => {
    const img = new Image();
    img.src = `/assets/characters/char_${palette}.png`;
    img.onload = () => resolve(buildSpriteSheet(img, hueShift));
    img.onerror = reject;
  });

  sheetCache.set(key, promise);
  return promise;
}

export function clearSpriteCache() {
  sheetCache.forEach(async (p) => {
    const sheet = await p;
    sheet.dispose();
  });
  sheetCache.clear();
}
