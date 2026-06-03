'use client';

import { useCallback } from 'react';
import { Html } from '@react-three/drei';
import type { ApprovalRequest } from '@/types/session';

interface PermissionBubbleProps {
  approval: ApprovalRequest;
  onOpenModal: (approvalId: string) => void;
}

export function PermissionBubble({
  approval,
  onOpenModal,
}: Readonly<PermissionBubbleProps>) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onOpenModal(approval.id);
    },
    [approval.id, onOpenModal],
  );

  const truncated =
    approval.command.length > 28
      ? approval.command.slice(0, 25) + '...'
      : approval.command;

  return (
    <Html
      position={[0, 0.9, 0]}
      center
      occlude={false}
      style={{ pointerEvents: 'none' }}
    >
      <style>{`
        @keyframes pb-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.75; transform: scale(1.04); }
        }
        @keyframes pb-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .permission-bubble {
          animation: pb-pulse 1.4s ease-in-out infinite;
          cursor: pointer;
          pointer-events: all;
          font-family: 'Geist Mono', monospace;
          background: #1a0a0a;
          border: 2px solid #ef4444;
          box-shadow: 2px 2px 0px #0a0a14, 0 0 8px rgba(239,68,68,0.4);
          padding: 5px 8px;
          white-space: nowrap;
          user-select: none;
        }
        .permission-bubble::after {
          content: '';
          position: absolute;
          bottom: -7px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid #ef4444;
        }
        .pb-icon {
          animation: pb-blink 0.8s step-start infinite;
        }
      `}</style>

      <div
        className="permission-bubble"
        onClick={handleClick}
        role="button"
        aria-label={`Approval required for ${approval.agentName}: ${approval.command}`}
        style={{ position: 'relative' }}
      >
        <span className="pb-icon" style={{ fontSize: 11, marginRight: 4 }}>
          &#9888;&#65039;
        </span>
        <span style={{ color: '#ef4444', fontSize: 10, fontWeight: 700 }}>
          {'승인 필요'}
        </span>
        <div
          style={{
            color: '#c07070',
            fontSize: 9,
            marginTop: 2,
            maxWidth: 140,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {truncated}
        </div>
      </div>
    </Html>
  );
}
