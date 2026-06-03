'use client';

import { useState } from 'react';

interface TerminalInputProps {
  agentId: string;
  sessionId?: string;
  disabled?: boolean;
}

export function TerminalInput({ agentId, sessionId, disabled = false }: Readonly<TerminalInputProps>) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || sending) return;

    setSending(true);
    try {
      await fetch('/api/relay/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId ?? agentId,
          teamId: 'dk-harness-office',
          agentName: agentId,
          eventType: 'command',
          payload: { text: trimmed },
          timestamp: Date.now(),
        }),
      });
      setText('');
    } catch {
      // silent fail — terminal will show no echo
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
        borderTop: '1px solid #2a2a4a',
        background: '#0a0a0f',
      }}
    >
      <span style={{ color: '#4a9eff', fontFamily: 'monospace', fontSize: 13 }}>
        {agentId}&gt;
      </span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || sending}
        placeholder={disabled ? '관전 모드 — 원격 제어가 연결되면 입력할 수 있어요' : '명령 입력...'}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#e0e0e0',
          fontFamily: 'Geist Mono, monospace',
          fontSize: 13,
          caretColor: '#4a9eff',
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || sending || !text.trim()}
        style={{
          padding: '2px 10px',
          background: disabled || !text.trim() ? '#1a1a2e' : '#1e3a5f',
          color: disabled || !text.trim() ? '#444466' : '#4a9eff',
          border: '1px solid #2a2a4a',
          borderRadius: 0,
          cursor: disabled || !text.trim() ? 'default' : 'pointer',
          fontFamily: 'Geist Mono, monospace',
          fontSize: 12,
        }}
      >
        Send
      </button>
    </div>
  );
}
