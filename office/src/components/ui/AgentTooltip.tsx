'use client';

import { Html } from '@react-three/drei';

interface AgentTooltipProps {
  name: string;
  role: string;
  status: string;
  currentTool?: string;
}

const STATUS_COLOR: Record<string, string> = {
  active: '#22c55e',
  working: '#22c55e',
  idle: '#eab308',
  reviewing: '#eab308',
  waiting: '#ef4444',
  blocked: '#ef4444',
  offline: '#6b7280',
};

export function AgentTooltip({ name, role, status, currentTool }: Readonly<AgentTooltipProps>) {
  const statusColor = STATUS_COLOR[status] ?? '#6b7280';

  return (
    <Html
      center
      distanceFactor={8}
      style={{ pointerEvents: 'none' }}
      zIndexRange={[100, 200]}
    >
      <div
        style={{
          background: '#0f0f17',
          border: `1px solid ${statusColor}`,
          boxShadow: `2px 2px 0 #000000, 3px 3px 0 ${statusColor}33`,
          padding: '6px 10px',
          minWidth: 120,
          maxWidth: 200,
          borderRadius: 0,
          fontFamily: 'Geist Mono, monospace',
          fontSize: 11,
          whiteSpace: 'nowrap',
          transform: 'translateY(-110%)',
        }}
      >
        {/* Name */}
        <div style={{ color: '#ffffff', fontWeight: 700, marginBottom: 2, fontSize: 12 }}>
          {name}
        </div>
        {/* Role */}
        <div style={{ color: '#5050a0', marginBottom: 4 }}>{role}</div>
        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: currentTool ? 3 : 0 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusColor,
              flexShrink: 0,
            }}
          />
          <span style={{ color: statusColor, textTransform: 'uppercase', fontSize: 10 }}>
            {status}
          </span>
        </div>
        {/* Current tool */}
        {currentTool && (
          <div
            style={{
              color: '#4a9eff',
              fontSize: 10,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 180,
            }}
          >
            {currentTool}
          </div>
        )}
      </div>
    </Html>
  );
}
