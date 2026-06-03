import * as THREE from 'three';

/**
 * dk-harness 에이전트 SVG를 Three.js CanvasTexture로 변환
 * 16x16 픽셀아트 SVG → 64x64 Canvas (4x 업스케일, NearestFilter로 도트감 유지)
 */

const RENDER_SIZE = 128; // 캔버스 크기 (고해상도 렌더링)
const textureCache = new Map<string, THREE.CanvasTexture>();

export function loadAgentTexture(agentId: string): Promise<THREE.CanvasTexture> {
  const cached = textureCache.get(agentId);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
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
    img.onerror = () => reject(new Error(`Failed to load SVG for agent: ${agentId}`));
  });
}

export function clearTextureCache() {
  textureCache.forEach((t) => t.dispose());
  textureCache.clear();
}
