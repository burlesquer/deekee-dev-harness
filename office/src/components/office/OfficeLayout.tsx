'use client';

import { Desk, Chair, Monitor, KanbanBoard, Whiteboard, Plant, WaterCooler } from './Furniture';

export interface SeatPosition {
  id: string;
  position: [number, number, number];
}

// 사무실 좌석 배치 (10명 에이전트)
// 뒤쪽 벽(-Z)에 보드, 앞쪽(+Z)에 Iron 특별석
export const SEAT_POSITIONS: SeatPosition[] = [
  // Sam — 중앙 상단 단독 데스크
  { id: 'sam',   position: [0,   0, -5.5] },
  // Klay, Able — 좌측 중단
  { id: 'klay',  position: [-3,  0, -2.5] },
  { id: 'able',  position: [-1,  0, -2.5] },
  // Willji, Rowan — 우측 중단
  { id: 'willji', position: [1,  0, -2.5] },
  { id: 'rowan',  position: [3,  0, -2.5] },
  // Jay, Jerry — 좌측 하단
  { id: 'jay',   position: [-3,  0,  1.0] },
  { id: 'jerry', position: [-1,  0,  1.0] },
  // Derek, Milla — 우측 하단
  { id: 'derek', position: [1,   0,  1.0] },
  { id: 'milla', position: [3,   0,  1.0] },
  // Iron — 특별석 (앞쪽 중앙)
  { id: 'iron',  position: [0,   0,  4.5] },
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
