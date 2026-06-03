'use client';

interface PositionProps {
  position: [number, number, number];
}

export function Desk({ position }: Readonly<PositionProps>) {
  const [x, y, z] = position;

  return (
    <group>
      {/* 상판 — 밝은 메이플 우드 */}
      <mesh position={[x, y + 0.75, z]} castShadow>
        <boxGeometry args={[1.2, 0.05, 0.6]} />
        <meshStandardMaterial color="#deb887" roughness={0.7} />
      </mesh>
      {/* 다리 — 화이트 메탈 */}
      {[
        [x - 0.55, y + 0.35, z - 0.25],
        [x + 0.55, y + 0.35, z - 0.25],
        [x - 0.55, y + 0.35, z + 0.25],
        [x + 0.55, y + 0.35, z + 0.25],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.04, 0.7, 0.04]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.4} metalness={0.3} />
        </mesh>
      ))}
      {/* 키보드 */}
      <mesh position={[x, y + 0.79, z + 0.12]}>
        <boxGeometry args={[0.35, 0.015, 0.12]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.6} />
      </mesh>
      {/* 커피 머그 */}
      <mesh position={[x + 0.4, y + 0.80, z + 0.15]}>
        <cylinderGeometry args={[0.035, 0.03, 0.08, 8]} />
        <meshStandardMaterial color="#FF6B2C" roughness={0.5} />
      </mesh>
    </group>
  );
}

export function Chair({ position }: Readonly<PositionProps>) {
  const [x, y, z] = position;

  return (
    <group>
      {/* 좌석 — 오렌지 패브릭 */}
      <mesh position={[x, y + 0.45, z]}>
        <boxGeometry args={[0.5, 0.06, 0.5]} />
        <meshStandardMaterial color="#FF8F5C" roughness={0.8} />
      </mesh>
      {/* 등받이 */}
      <mesh position={[x, y + 0.75, z - 0.22]}>
        <boxGeometry args={[0.5, 0.6, 0.05]} />
        <meshStandardMaterial color="#FF8F5C" roughness={0.8} />
      </mesh>
      {/* 지지대 — 크롬 */}
      <mesh position={[x, y + 0.22, z]}>
        <cylinderGeometry args={[0.03, 0.03, 0.44, 6]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* 바퀴 */}
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh key={i} position={[x + Math.cos(rad) * 0.2, y + 0.03, z + Math.sin(rad) * 0.2]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color="#888888" metalness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

export function Monitor({ position }: Readonly<PositionProps>) {
  const [x, y, z] = position;

  return (
    <group>
      {/* 노트북 베이스 (키보드 부분) — 데스크 위에 납작하게 */}
      <mesh position={[x, y + 0.785, z]}>
        <boxGeometry args={[0.38, 0.015, 0.26]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* 키보드 영역 */}
      <mesh position={[x, y + 0.793, z + 0.02]}>
        <boxGeometry args={[0.32, 0.003, 0.16]} />
        <meshStandardMaterial color="#c8c8c8" roughness={0.5} />
      </mesh>
      {/* 트랙패드 */}
      <mesh position={[x, y + 0.793, z + 0.10]}>
        <boxGeometry args={[0.10, 0.002, 0.07]} />
        <meshStandardMaterial color="#d8d8d8" roughness={0.3} />
      </mesh>
      {/* 스크린 (기울어진 상태) */}
      <mesh position={[x, y + 0.92, z - 0.12]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.36, 0.24, 0.008]} />
        <meshStandardMaterial color="#e0e0e0" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* 스크린 디스플레이 (오렌지 발광) */}
      <mesh position={[x, y + 0.92, z - 0.116]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.32, 0.20, 0.001]} />
        <meshStandardMaterial
          color="#FF6B2C"
          emissive="#FF6B2C"
          emissiveIntensity={0.35}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

export function KanbanBoard({ position }: Readonly<PositionProps>) {
  const [x, y, z] = position;

  return (
    <group>
      {/* 프레임 — 밝은 우드 */}
      <mesh position={[x, y, z - 0.01]}>
        <boxGeometry args={[1.54, 1.04, 0.02]} />
        <meshStandardMaterial color="#c8a882" roughness={0.7} />
      </mesh>
      {/* 보드 표면 */}
      <mesh position={[x, y, z]}>
        <boxGeometry args={[1.5, 1.0, 0.03]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
      {/* 컬럼 구분선 */}
      {[-0.38, 0.12].map((offset, i) => (
        <mesh key={i} position={[x + offset, y, z + 0.016]}>
          <boxGeometry args={[0.01, 0.9, 0.005]} />
          <meshStandardMaterial color="#e0d0c0" />
        </mesh>
      ))}
      {/* 컬럼 헤더: Todo(오렌지) / Progress(골드) / Done(그린) */}
      {[
        { dx: -0.55, color: '#FF6B2C' },
        { dx: -0.07, color: '#eab308' },
        { dx: 0.41, color: '#22c55e' },
      ].map(({ dx, color }, i) => (
        <mesh key={i} position={[x + dx, y + 0.41, z + 0.018]}>
          <boxGeometry args={[0.36, 0.12, 0.002]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      ))}
      {/* 태스크 카드들 */}
      {[
        { dx: -0.55, dy: 0.15 }, { dx: -0.55, dy: -0.05 },
        { dx: -0.07, dy: 0.15 },
        { dx: 0.41, dy: 0.15 }, { dx: 0.41, dy: -0.05 }, { dx: 0.41, dy: -0.25 },
      ].map(({ dx, dy }, i) => (
        <mesh key={i} position={[x + dx, y + dy, z + 0.02]}>
          <boxGeometry args={[0.3, 0.14, 0.002]} />
          <meshStandardMaterial color="#fff8f3" />
        </mesh>
      ))}
    </group>
  );
}

export function Whiteboard({ position }: Readonly<PositionProps>) {
  const [x, y, z] = position;

  return (
    <group>
      {/* 프레임 — 알루미늄 */}
      <mesh position={[x, y, z - 0.01]}>
        <boxGeometry args={[2.04, 1.24, 0.02]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.4} roughness={0.3} />
      </mesh>
      {/* 보드 표면 */}
      <mesh position={[x, y, z]}>
        <boxGeometry args={[2.0, 1.2, 0.03]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </mesh>
      {/* 마커 트레이 */}
      <mesh position={[x, y - 0.65, z + 0.02]}>
        <boxGeometry args={[1.8, 0.06, 0.06]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
      {/* 마커들 — 오렌지, 블루, 그린 */}
      {[
        { dx: -0.2, color: '#FF6B2C' },
        { dx: 0, color: '#3b82f6' },
        { dx: 0.2, color: '#22c55e' },
      ].map(({ dx, color }, i) => (
        <mesh key={i} position={[x + dx, y - 0.63, z + 0.06]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.1, 6]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

/** 관엽식물 */
export function Plant({ position }: Readonly<PositionProps>) {
  const [x, y, z] = position;
  return (
    <group>
      {/* 화분 — 테라코타 */}
      <mesh position={[x, y + 0.25, z]}>
        <cylinderGeometry args={[0.15, 0.12, 0.5, 8]} />
        <meshStandardMaterial color="#c67a4a" roughness={0.9} />
      </mesh>
      {/* 잎 */}
      <mesh position={[x, y + 0.7, z]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#4a9a44" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** 워터쿨러 */
export function WaterCooler({ position }: Readonly<PositionProps>) {
  const [x, y, z] = position;
  return (
    <group>
      {/* 본체 — 화이트 */}
      <mesh position={[x, y + 0.5, z]}>
        <boxGeometry args={[0.3, 1.0, 0.3]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.5} metalness={0.1} />
      </mesh>
      {/* 물통 */}
      <mesh position={[x, y + 1.15, z]}>
        <cylinderGeometry args={[0.12, 0.12, 0.35, 8]} />
        <meshStandardMaterial color="#a8d8ff" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
