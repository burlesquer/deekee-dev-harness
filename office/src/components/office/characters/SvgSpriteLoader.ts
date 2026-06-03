import * as THREE from 'three';

/**
 * dk-harness 에이전트 SVG를 Three.js CanvasTexture로 변환
 * 16x16 픽셀아트 SVG → 64x64 Canvas (4x 업스케일, NearestFilter로 도트감 유지)
 */

const RENDER_SIZE = 128; // 캔버스 크기 (고해상도 렌더링)
const textureCache = new Map<string, THREE.CanvasTexture>();

const DEFAULT_FALLBACK_COLOR = '#FF6B2C';

/**
 * SVG 자산이 없는 에이전트용 절차적 폴백 텍스처.
 * 고유 screenColor 모니터 + 이니셜을 그려 흰 네모 대신 식별 가능한 도트를 렌더한다.
 * (랜딩의 AgentSvgIcon 과 동일한 모티프)
 */
function buildFallbackTexture(agentId: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = RENDER_SIZE;
  canvas.height = RENDER_SIZE;
  const ctx = canvas.getContext('2d')!;
  const s = RENDER_SIZE / 28; // 28-grid 뷰박스를 캔버스에 매핑

  ctx.lineJoin = 'round';

  // 모니터 본체
  ctx.fillStyle = withAlpha(color, 0.18);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4 * s;
  roundRect(ctx, 3 * s, 4 * s, 22 * s, 14 * s, 2 * s);
  ctx.fill();
  ctx.stroke();

  // 스크린
  ctx.fillStyle = withAlpha(color, 0.3);
  roundRect(ctx, 5 * s, 6 * s, 18 * s, 10 * s, 1 * s);
  ctx.fill();

  // 받침대
  ctx.fillStyle = withAlpha(color, 0.45);
  ctx.fillRect(12 * s, 18 * s, 4 * s, 3 * s);
  roundRect(ctx, 9 * s, 21 * s, 10 * s, 1.6 * s, 0.8 * s);
  ctx.fill();

  // 이니셜
  ctx.fillStyle = color;
  ctx.font = `700 ${6 * s}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(agentId.slice(0, 2).toUpperCase(), 14 * s, 11 * s);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** #RRGGBB + 0~1 알파 → rgba() 문자열. */
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function loadAgentTexture(agentId: string, fallbackColor: string = DEFAULT_FALLBACK_COLOR): Promise<THREE.CanvasTexture> {
  const cached = textureCache.get(agentId);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const img = new Image();
    img.src = `/assets/agents/${agentId}.svg`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = RENDER_SIZE;
      canvas.height = RENDER_SIZE;
      const ctx = canvas.getContext('2d')!;

      // 픽셀 보간 끄기 → 도트감 유지
      ctx.imageSmoothingEnabled = false;

      // SVG를 캔버스에 렌더 (업스케일)
      ctx.drawImage(img, 0, 0, RENDER_SIZE, RENDER_SIZE);

      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      texture.colorSpace = THREE.SRGBColorSpace;

      textureCache.set(agentId, texture);
      resolve(texture);
    };
    img.onerror = () => {
      // SVG 자산이 없으면 흰 네모 대신 절차적 폴백을 렌더한다.
      const fallback = buildFallbackTexture(agentId, fallbackColor);
      textureCache.set(agentId, fallback);
      resolve(fallback);
    };
  });
}

export function clearTextureCache() {
  textureCache.forEach((t) => t.dispose());
  textureCache.clear();
}
