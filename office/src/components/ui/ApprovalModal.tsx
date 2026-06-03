'use client';

import { useState, useCallback } from 'react';
import { useOfficeStore } from '@/stores/office-store';
import type { ApprovalRequest } from '@/types/session';

interface ApprovalModalProps {
  approval: ApprovalRequest;
  onClose: () => void;
}

export function ApprovalModal({ approval, onClose }: Readonly<ApprovalModalProps>) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const removeApproval = useOfficeStore((s) => s.removeApproval);
  const setActiveApproval = useOfficeStore((s) => s.setActiveApproval);

  const handleDecide = useCallback(
    async (decision: 'approved' | 'denied') => {
      setLoading(true);
      try {
        const res = await fetch('/api/approvals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            approvalId: approval.id,
            decision,
            reason: reason.trim() || undefined,
            decidedBy: 'user',
          }),
        });
        if (res.ok) {
          removeApproval(approval.id);
          setActiveApproval(null);
          onClose();
        }
      } finally {
        setLoading(false);
      }
    },
    [approval.id, reason, removeApproval, setActiveApproval, onClose],
  );

  const handleCancel = useCallback(() => {
    setActiveApproval(null);
    onClose();
  }, [setActiveApproval, onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div
        style={{
          background: '#0f0f17',
          border: '2px solid #ef4444',
          boxShadow: '4px 4px 0px #0a0a14',
          width: 480,
          maxWidth: '90vw',
          fontFamily: 'Geist Mono, monospace',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#1a0a0a',
            borderBottom: '2px solid #ef4444',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            id="approval-modal-title"
            style={{ color: '#ef4444', fontSize: 13, fontWeight: 700 }}
          >
            &#9888;&#65039; Permission Required
          </span>
          <span style={{ color: '#7070a0', fontSize: 11 }}>{approval.agentName}</span>
        </div>

        {/* Body */}
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Field label="Agent" value={approval.agentName} />
          <Field label="Tool" value={approval.toolName} />

          {/* Command block */}
          <div>
            <div style={{ color: '#4a4a7a', fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              Command
            </div>
            <pre
              style={{
                background: '#080810',
                border: '1px solid #2a2a4a',
                color: '#ef4444',
                fontSize: 11,
                padding: '8px 10px',
                margin: 0,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {approval.command}
            </pre>
          </div>

          {approval.description && (
            <Field label="Description" value={approval.description} />
          )}

          {/* Deny reason input */}
          <div>
            <div style={{ color: '#4a4a7a', fontSize: 10, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
              Deny Reason (optional)
            </div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason for denial..."
              rows={2}
              style={{
                width: '100%',
                background: '#080810',
                border: '1px solid #2a2a4a',
                color: '#c0c0d8',
                fontSize: 11,
                padding: '6px 8px',
                resize: 'vertical',
                fontFamily: 'Geist Mono, monospace',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            borderTop: '1px solid #1e1e3a',
            padding: '10px 16px',
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={handleCancel}
            disabled={loading}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: '1px solid #2a2a4a',
              color: '#7070a0',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'Geist Mono, monospace',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => handleDecide('denied')}
            disabled={loading}
            style={{
              padding: '6px 14px',
              background: '#3a0a0a',
              border: '1px solid #ef4444',
              color: '#ef4444',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'Geist Mono, monospace',
            }}
          >
            Deny &#10060;
          </button>
          <button
            onClick={() => handleDecide('approved')}
            disabled={loading}
            style={{
              padding: '6px 14px',
              background: '#0a1a0a',
              border: '1px solid #22c55e',
              color: '#22c55e',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'Geist Mono, monospace',
            }}
          >
            Approve &#9989;
          </button>
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
}

function Field({ label, value }: Readonly<FieldProps>) {
  return (
    <div>
      <div style={{ color: '#4a4a7a', fontSize: 10, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </div>
      <div style={{ color: '#c0c0d8', fontSize: 12 }}>{value}</div>
    </div>
  );
}
