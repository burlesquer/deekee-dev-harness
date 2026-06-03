'use client';

import { Desk, Chair, Monitor, KanbanBoard, Whiteboard, Plant, WaterCooler } from './Furniture';

export interface SeatPosition {
  id: string;
  position: [number, number, number];
}

// 사무실 좌석 배치 (21명 에이전트)
// 뒤쪽 벽(-Z)에 보드, Sam 단독석 → 4개 행(각 5석) 그리드
// x: -4.8 ~ 4.8 (간격 2.4), z: -7 ~ 4.5 (행 간격 ~3)
export const SEAT_POSITIONS: SeatPosition[] = [
  // Sam — 중앙 상단 단독 데스크
  { id: 'sam',   position: [0,    0, -7.0] },

  // Row 1 — 리더십 · 심의
  { id: 'simon',  position: [-4.8, 0, -4.0] },
  { id: 'able',   position: [-2.4, 0, -4.0] },
  { id: 'klay',   position: [0,    0, -4.0] },
  { id: 'ryan',   position: [2.4,  0, -4.0] },
  { id: 'critic', position: [4.8,  0, -4.0] },

  // Row 2 — 백엔드 · 인프라
  { id: 'jay',   position: [-4.8, 0, -1.0] },
  { id: 'jerry', position: [-2.4, 0, -1.0] },
  { id: 'milla', position: [0,    0, -1.0] },
  { id: 'jun',   position: [2.4,  0, -1.0] },
  { id: 'kain',  position: [4.8,  0, -1.0] },

  // Row 3 — 프론트 · 디자인
  { id: 'willji',       position: [-4.8, 0, 2.0] },
  { id: 'derek',        position: [-2.4, 0, 2.0] },
  { id: 'rowan',        position: [0,    0, 2.0] },
  { id: 'figma-reader', position: [2.4,  0, 2.0] },
  { id: 'noah',         position: [4.8,  0, 2.0] },

  // Row 4 — AI · 특수
  { id: 'jo',               position: [-4.8, 0, 4.5] },
  { id: 'hugg',             position: [-2.4, 0, 4.5] },
  { id: 'iron',             position: [0,    0, 4.5] },
  { id: 'teacher',          position: [2.4,  0, 4.5] },
  { id: 'progress-checker', position: [4.8,  0, 4.5] },
];

export function OfficeLayout() {
  return (
    <group>
      {/* 벽 부착 보드들 (뒤 벽) */}
      <Whiteboard   position={[-3.5, 2.0, -9.83]} />
      <KanbanBoard  position={[3.0,  2.0, -9.83]} />

      {/* 사무실 소품 */}
      <Plant position={[-9, 0, -8]} />
      <Plant position={[9, 0, -8]} />
      <Plant position={[-9, 0, 4]} />
      <Plant position={[9, 0, 4]} />
      <WaterCooler position={[8, 0, -3]} />

      {/* 에이전트별 데스크 + 의자 + 모니터 */}
      {SEAT_POSITIONS.map(({ id, position }) => {
        const [x, y, z] = position;
        return (
          <group key={id}>
            <Desk     position={[x, y, z]} />
            {/* 의자는 데스크 앞쪽에 배치 */}
            <Chair    position={[x, y, z + 0.7]} />
            {/* 모니터는 데스크 위 */}
            <Monitor  position={[x, y, z - 0.1]} />
          </group>
        );
      })}
    </group>
  );
}
