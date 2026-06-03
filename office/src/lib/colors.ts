/**
 * dk-harness-landing 컬러 시스템 (dk-harness-office 공유)
 * 원본: /ZIVO/dk-harness-landing/app/globals.css + AgentTeam.tsx
 */

// 브랜드 컬러
export const DK_COLORS = {
  primary: '#FF6B2C',       // dk-harness orange
  primaryHover: '#FF8F5C',
  dark: '#2D3436',
  lightBg: '#FFF8F3',
  muted: 'rgba(45, 52, 54, 0.6)',

  // 3D 오피스 다크 톤
  officeBg: '#0a0a0f',
  surface: '#12121e',
  surfaceElevated: '#1a1a2e',
  border: '#2a2a3e',
  text: '#e0e0f0',
  textMuted: 'rgba(224, 224, 240, 0.6)',

  // 터미널 컬러
  terminalBg: '#1E2527',
  terminalRed: '#FF5F56',
  terminalYellow: '#FFBD2E',
  terminalGreen: '#27C93F',

  // 상태 컬러
  statusActive: '#22c55e',
  statusIdle: '#eab308',
  statusBlocked: '#ef4444',
  statusOffline: '#6b7280',
} as const;

// 에이전트별 고유 screenColor (dk-harness-landing AgentTeam.tsx 기준)
export const AGENT_SCREEN_COLORS: Record<string, string> = {
  sam: '#a78bfa',     // 보라
  able: '#60a5fa',    // 파랑
  klay: '#5eead4',    // 민트
  jay: '#fb923c',     // 주황
  jerry: '#fbbf24',   // 노랑
  milla: '#4ade80',   // 초록
  willji: '#f9a8d4',  // 핑크
  derek: '#22d3ee',   // 시안
  rowan: '#a3e635',   // 라임
  iron: '#d946ef',    // 마젠타
} as const;

// 에이전트 설정 (이름, 역할, 부서, 모델)
export const AGENT_CONFIG = [
  { id: 'sam',    name: 'Sam',    role: 'CTO',         dept: 'CTO',    model: 'opus' },
  { id: 'able',   name: 'Able',   role: '기획',        dept: '기획',   model: 'sonnet' },
  { id: 'klay',   name: 'Klay',   role: '설계',        dept: '기획',   model: 'opus' },
  { id: 'jay',    name: 'Jay',    role: 'API',         dept: '백엔드', model: 'sonnet' },
  { id: 'jerry',  name: 'Jerry',  role: 'DB',          dept: '백엔드', model: 'sonnet' },
  { id: 'milla',  name: 'Milla',  role: '보안',        dept: '백엔드', model: 'sonnet' },
  { id: 'willji', name: 'Willji', role: '디자인',      dept: '디자인', model: 'sonnet' },
  { id: 'derek',  name: 'Derek',  role: '화면',        dept: '프론트', model: 'sonnet' },
  { id: 'rowan',  name: 'Rowan',  role: '모션',        dept: '프론트', model: 'sonnet' },
  { id: 'iron',   name: 'Iron',   role: '마법사',      dept: '마법',   model: 'sonnet' },
] as const;
