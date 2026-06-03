'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { loadAgentTexture } from './SvgSpriteLoader';
import { AgentTooltip } from '@/components/ui/AgentTooltip';
import { PermissionBubble } from './PermissionBubble';
import { ChatBubble } from './ChatBubble';
import { useOfficeStore } from '@/stores/office-store';

interface CharacterBillboardProps {
  agentId: string;
  position: [number, number, number];
  name: string;
  role: string;
  screenColor?: string;
  agentStatus?: 'idle' | 'working' | 'reviewing' | 'blocked';
  currentTool?: string;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  isHovered?: boolean;
  isSelected?: boolean;
  lastChatMessage?: string;
}

/** agentId 기반 시드 해시 (0~1 범위) */
function hashSeed(agentId: string, salt = 0): number {
  let hash = salt;
  for (let i = 0; i < agentId.length; i++) {
    hash = (hash * 31 + agentId.charCodeAt(i)) & 0xffffffff;
  }
  return (hash >>> 0) / 0xffffffff;
}

/** 시드 기반 간이 난수 생성기 (매 호출 다른 값) */
function seededRandom(seed: { v: number }): number {
  seed.v = (seed.v * 16807 + 0) % 2147483647;
  return (seed.v & 0x7fffffff) / 0x7fffffff;
}

// 오피스 내 관심 지점 (월드 좌표, 데스크 기준 오프셋으로 변환하여 사용)
const OFFICE_POIS = [
  { x: 8, z: -3, label: 'water-cooler' },
  { x: -3.5, z: -8.5, label: 'whiteboard' },
  { x: 3, z: -8.5, label: 'kanban' },
  { x: 0, z: 0, label: 'center' },
  { x: -6, z: 0, label: 'hallway-left' },
  { x: 6, z: 0, label: 'hallway-right' },
];

// 에이전트별 성격 (산책 빈도, 이동 속도, 최대 거리)
const PERSONALITY: Record<string, { restMin: number; restMax: number; speed: number; maxDist: number }> = {
  sam:    { restMin: 8, restMax: 15, speed: 0.6, maxDist: 4.0 },  // CTO: 주로 자리
  iron:   { restMin: 3, restMax: 6,  speed: 1.0, maxDist: 6.0 },  // 마법사: 활발
  rowan:  { restMin: 3, restMax: 7,  speed: 1.2, maxDist: 5.5 },  // 모션: 빠름
  willji: { restMin: 4, restMax: 8,  speed: 0.8, maxDist: 5.0 },  // 디자인: 보드 자주 방문
  klay:   { restMin: 5, restMax: 10, speed: 0.7, maxDist: 5.0 },  // 설계: 적당
  milla:  { restMin: 6, restMax: 12, speed: 0.7, maxDist: 4.5 },  // 보안: 차분
};
const DEFAULT_PERSONALITY = { restMin: 5, restMax: 10, speed: 0.8, maxDist: 5.0 };

type WanderPhase = 'desk' | 'walking-to' | 'visiting' | 'walking-back';

interface WanderState {
  phase: WanderPhase;
  targetX: number;
  targetZ: number;
  currentX: number;
  currentZ: number;
  timer: number;
  phaseDuration: number;
  seed: { v: number };
}

export function CharacterBillboard({
  agentId,
  position,
  name,
  role,
  screenColor,
  agentStatus = 'idle',
  currentTool,
  onSelect,
  onHover,
  isHovered = false,
  isSelected = false,
  lastChatMessage,
}: Readonly<CharacterBillboardProps>) {
  const approvals = useOfficeStore((s) => s.approvals);
  const setActiveApproval = useOfficeStore((s) => s.setActiveApproval);

  const pendingApproval = approvals.find(
    (a) =>
      a.status === 'pending' &&
      (a.agentName.toLowerCase() === agentId.toLowerCase() ||
        a.agentName.toLowerCase() === name.toLowerCase()),
  );

  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // 스폰 페이드인
  const [targetOpacity, setTargetOpacity] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setTargetOpacity(1), 50);
    return () => clearTimeout(timer);
  }, []);

  // 자율 산책 상태 (ref로 관리하여 리렌더 방지)
  const initSeed = hashSeed(agentId);
  const initP = PERSONALITY[agentId] || DEFAULT_PERSONALITY;
  const wanderRef = useRef<WanderState>({
    phase: 'desk',
    targetX: 0,
    targetZ: 0,
    currentX: 0,
    currentZ: 0,
    timer: 0,
    phaseDuration: initP.restMin + initSeed * (initP.restMax - initP.restMin),
    seed: { v: Math.floor(initSeed * 2147483647) || 1 },
  });

  const handleClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onSelect?.(agentId);
    },
    [agentId, onSelect],
  );

  const handlePointerOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onHover?.(agentId);
    },
    [agentId, onHover],
  );

  const handlePointerOut = useCallback(() => {
    onHover?.(null);
  }, [onHover]);

  // SVG 텍스처 로드
  useEffect(() => {
    let cancelled = false;
    // SVG 자산이 없으면 로더가 screenColor 기반 폴백 텍스처를 반환한다(흰 네모 방지).
    loadAgentTexture(agentId, screenColor)
      .then((t) => {
        if (!cancelled) {
          setTexture(t);
          if (materialRef.current) {
            materialRef.current.map = t;
            materialRef.current.needsUpdate = true;
          }
        }
      })
      .catch(() => {
        // 폴백까지 실패하는 경우는 없지만 방어적으로 무시한다.
      });
    return () => {
      cancelled = true;
    };
  }, [agentId, screenColor]);

  // 애니메이션 프레임 — 자율 산책 시스템
  const prevTimeRef = useRef(0);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const now = clock.elapsedTime;
    const dt = Math.min(now - (prevTimeRef.current || now), 0.1); // cap delta
    prevTimeRef.current = now;

    const isWorking = agentStatus === 'working' || agentStatus === 'reviewing';

    if (isWorking) {
      // 작업 중: 데스크에 부드럽게 복귀
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, 0, 0.08);
      meshRef.current.position.y = 0;
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, 0, 0.08);
      const pulse = 1.0 + Math.sin(now * 3) * 0.02;
      meshRef.current.scale.set(pulse, pulse, 1);

      // 산책 상태도 리셋
      const w = wanderRef.current;
      w.phase = 'desk';
      w.currentX = meshRef.current.position.x;
      w.currentZ = meshRef.current.position.z;
      w.timer = 0;
    } else {
      // idle/blocked: 자율 산책
      const w = wanderRef.current;
      const p = PERSONALITY[agentId] || DEFAULT_PERSONALITY;
      w.timer += dt;

      const [deskX, , deskZ] = position;
      const charZ = deskZ + 0.7; // charPos 기준

      switch (w.phase) {
        case 'desk': {
          // 자리에 앉아서 대기, 살짝 흔들림
          const sway = Math.sin(now * 0.5 + hashSeed(agentId) * 10) * 0.05;
          meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, sway, 0.05);
          meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, 0, 0.05);

          if (w.timer >= w.phaseDuration) {
            // POI 선택: 70% 확률로 오피스 POI, 30% 확률로 근처 랜덤
            const r = seededRandom(w.seed);
            if (r < 0.7) {
              const poi = OFFICE_POIS[Math.floor(seededRandom(w.seed) * OFFICE_POIS.length)];
              w.targetX = poi.x - deskX;
              w.targetZ = poi.z - charZ;
            } else {
              const angle = seededRandom(w.seed) * Math.PI * 2;
              const dist = 1.5 + seededRandom(w.seed) * 2.5;
              w.targetX = Math.cos(angle) * dist;
              w.targetZ = Math.sin(angle) * dist;
            }
            // maxDist 클램프
            const dist = Math.sqrt(w.targetX * w.targetX + w.targetZ * w.targetZ);
            if (dist > p.maxDist) {
              const scale = p.maxDist / dist;
              w.targetX *= scale;
              w.targetZ *= scale;
            }
            w.currentX = meshRef.current.position.x;
            w.currentZ = meshRef.current.position.z;
            w.phase = 'walking-to';
            w.timer = 0;
          }
          break;
        }

        case 'walking-to': {
          // 목적지로 이동
          const dx = w.targetX - w.currentX;
          const dz = w.targetZ - w.currentZ;
          const remaining = Math.sqrt(dx * dx + dz * dz);

          if (remaining < 0.08) {
            w.currentX = w.targetX;
            w.currentZ = w.targetZ;
            w.phase = 'visiting';
            w.timer = 0;
            w.phaseDuration = 2 + seededRandom(w.seed) * 4; // 2~6초 체류
          } else {
            const step = Math.min(p.speed * dt, remaining);
            w.currentX += (dx / remaining) * step;
            w.currentZ += (dz / remaining) * step;
          }

          // 걷기 바운스
          const bounce = Math.sin(now * 6) * 0.04;
          meshRef.current.position.x = w.currentX;
          meshRef.current.position.y = Math.abs(bounce);
          meshRef.current.position.z = w.currentZ;
          break;
        }

        case 'visiting': {
          // POI에서 주위 둘러보기 (작은 흔들림)
          const lookX = Math.sin(now * 0.8 + hashSeed(agentId, 1) * 5) * 0.15;
          const lookZ = Math.cos(now * 0.6 + hashSeed(agentId, 2) * 5) * 0.1;
          meshRef.current.position.x = w.targetX + lookX;
          meshRef.current.position.y = 0;
          meshRef.current.position.z = w.targetZ + lookZ;

          if (w.timer >= w.phaseDuration) {
            // 50% 확률로 다른 POI로 이동, 50% 확률로 자리 복귀
            if (seededRandom(w.seed) < 0.5) {
              w.currentX = w.targetX;
              w.currentZ = w.targetZ;
              w.targetX = 0;
              w.targetZ = 0;
              w.phase = 'walking-back';
            } else {
              const poi = OFFICE_POIS[Math.floor(seededRandom(w.seed) * OFFICE_POIS.length)];
              w.currentX = w.targetX;
              w.currentZ = w.targetZ;
              w.targetX = poi.x - deskX;
              w.targetZ = poi.z - charZ;
              const dist = Math.sqrt(w.targetX * w.targetX + w.targetZ * w.targetZ);
              if (dist > p.maxDist) {
                const sc = p.maxDist / dist;
                w.targetX *= sc;
                w.targetZ *= sc;
              }
              w.phase = 'walking-to';
            }
            w.timer = 0;
          }
          break;
        }

        case 'walking-back': {
          // 자리로 복귀
          const dx = -w.currentX;
          const dz = -w.currentZ;
          const remaining = Math.sqrt(dx * dx + dz * dz);

          if (remaining < 0.08) {
            w.currentX = 0;
            w.currentZ = 0;
            w.phase = 'desk';
            w.timer = 0;
            w.phaseDuration = p.restMin + seededRandom(w.seed) * (p.restMax - p.restMin);
          } else {
            const step = Math.min(p.speed * dt, remaining);
            w.currentX += (dx / remaining) * step;
            w.currentZ += (dz / remaining) * step;
          }

          const bounce = Math.sin(now * 6) * 0.04;
          meshRef.current.position.x = w.currentX;
          meshRef.current.position.y = Math.abs(bounce);
          meshRef.current.position.z = w.currentZ;
          break;
        }
      }

      meshRef.current.scale.set(1, 1, 1);
    }

    // 페이드인 lerp
    if (materialRef.current) {
      materialRef.current.opacity = THREE.MathUtils.lerp(
        materialRef.current.opacity,
        targetOpacity,
        0.05,
      );
    }
  });

  // 상태별 표시등 색상
  const statusColor =
    agentStatus === 'working'
      ? screenColor || '#22c55e'
      : agentStatus === 'reviewing'
        ? '#3b82f6'
        : agentStatus === 'blocked'
          ? '#ef4444'
          : '#6b7280';

  const [bx, by, bz] = position;
  const charPos: [number, number, number] = [bx, by + 1.2, bz + 0.7];

  return (
    <Billboard position={charPos} follow lockX={false} lockY={false} lockZ={false}>
      {/* 도트 캐릭터 (dk-harness SVG) */}
      <mesh
        ref={meshRef}
        scale={[1.0, 1.0, 1]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial
          ref={materialRef}
          map={texture}
          transparent
          alphaTest={0.1}
          side={THREE.DoubleSide}
          toneMapped={false}
          opacity={0}
        />
      </mesh>

      {/* 선택 하이라이트 링 */}
      {isSelected && (
        <mesh position={[0, -0.45, -0.01]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.42, 24]} />
          <meshBasicMaterial
            color={screenColor || '#FF6B2C'}
            transparent
            opacity={0.6}
            toneMapped={false}
          />
        </mesh>
      )}

      {/* working 상태 포인트 라이트 */}
      {agentStatus === 'working' && screenColor && (
        <pointLight position={[0, 0.3, 0.3]} color={screenColor} intensity={0.3} distance={2} />
      )}

      {/* 상태 표시등 (머리 위 작은 원) */}
      <mesh position={[0, 0.6, 0.01]}>
        <circleGeometry args={[0.06, 8]} />
        <meshBasicMaterial color={statusColor} toneMapped={false} />
      </mesh>

      {/* 채팅 말풍선 */}
      {lastChatMessage && (
        <ChatBubble text={lastChatMessage} screenColor={screenColor} />
      )}

      {/* 호버 말풍선 */}
      {isHovered && (
        <AgentTooltip
          name={name}
          role={role}
          status={agentStatus}
          currentTool={currentTool}
        />
      )}

      {/* 승인 대기 경고 */}
      {pendingApproval && (
        <PermissionBubble approval={pendingApproval} onOpenModal={setActiveApproval} />
      )}

      {/* 이름표 */}
      <Text
        position={[0, 0.68, 0.01]}
        fontSize={0.16}
        color="#2D3436"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#ffffff"
        font={undefined}
      >
        {name}
      </Text>

      {/* 역할 */}
      <Text
        position={[0, 0.55, 0.01]}
        fontSize={0.10}
        color="#FF6B2C"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.015}
        outlineColor="#ffffff"
        font={undefined}
      >
        {role}
      </Text>
    </Billboard>
  );
}
