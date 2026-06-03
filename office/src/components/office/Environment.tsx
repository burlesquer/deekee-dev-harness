'use client';

import { Grid } from '@react-three/drei';

interface EnvironmentProps {
  showGrid?: boolean;
}

export function Environment({ showGrid = true }: Readonly<EnvironmentProps>) {
  return (
    <>
      {/* 조명 — 밝은 오피스 */}
      <ambientLight intensity={0.8} color="#fff8f3" />
      <directionalLight position={[8, 14, 8]} intensity={1.2} color="#ffffff" castShadow />
      <directionalLight position={[-5, 10, -5]} intensity={0.4} color="#ffe4d0" />
      <pointLight position={[0, 6, 0]} intensity={0.3} color="#ffffff" />
      <hemisphereLight color="#fff8f3" groundColor="#f0e6dc" intensity={0.5} />

      {/* 바닥 — 밝은 우드 톤 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[24, 20]} />
        <meshStandardMaterial color="#f5ebe0" roughness={0.85} />
      </mesh>

      {/* 뒤 벽 — 밝은 크림 */}
      <mesh position={[0, 1.2, -10]}>
        <boxGeometry args={[24, 2.4, 0.15]} />
        <meshStandardMaterial color="#faf5ef" roughness={0.9} />
      </mesh>

      {/* 벽 위 장식선 (오렌지 accent) */}
      <mesh position={[0, 2.45, -10]}>
        <boxGeometry args={[24, 0.08, 0.2]} />
        <meshStandardMaterial color="#FF6B2C" roughness={0.6} />
      </mesh>

      {/* 좌측 낮은 파티션 — 유리 느낌 */}
      <mesh position={[-11.5, 0.6, -2]}>
        <boxGeometry args={[0.1, 1.2, 16]} />
        <meshStandardMaterial color="#e8ddd0" transparent opacity={0.5} />
      </mesh>

      {/* 우측 낮은 파티션 */}
      <mesh position={[11.5, 0.6, -2]}>
        <boxGeometry args={[0.1, 1.2, 16]} />
        <meshStandardMaterial color="#e8ddd0" transparent opacity={0.5} />
      </mesh>

      {/* 바닥 러그 (중앙 복도) — 따뜻한 베이지 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[3, 14]} />
        <meshStandardMaterial color="#ffe8d6" roughness={0.95} />
      </mesh>

      {/* 그리드 오버레이 */}
      {showGrid && (
        <Grid
          args={[24, 20]}
          position={[0, 0.01, 0]}
          cellSize={1}
          cellThickness={0.3}
          cellColor="#e0d0c0"
          sectionSize={5}
          sectionThickness={0.6}
          sectionColor="#d4b8a0"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid={false}
        />
      )}
    </>
  );
}
