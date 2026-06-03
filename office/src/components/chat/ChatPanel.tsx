'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useOfficeStore } from '@/stores/office-store';
import { AGENT_SCREEN_COLORS } from '@/lib/colors';
import type { ChatMessage } from '@/stores/office-store';

interface ChatPanelProps {
  roomId?: string;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  const s = d.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function ChatPanel({ roomId }: Readonly<ChatPanelProps>) {
  const chatMessages = useOfficeStore((s) => s.chatMessages);
  const [collapsed, setCollapsed] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!collapsed) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, collapsed]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText('');
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'user',
          agentName: 'User',
          text,
          roomId,
        }),
      });
    } catch {
      // 전송 실패 무시
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [inputText, sending, roomId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="shrink-0 border-t border-dk-harness-orange/15 bg-white">
      {/* 헤더 */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? '채팅 펼치기' : '채팅 접기'}
        className="flex w-full cursor-pointer items-center justify-between border-none bg-dk-harness-light px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-dk-harness-muted"
        style={{ borderBottom: collapsed ? 'none' : '1px solid rgba(255, 107, 44, 0.15)' }}
      >
        <span>Chat</span>
        <span className="text-[9px]">{collapsed ? '▲' : '▼'}</span>
      </button>

      {!collapsed && (
        <>
          {/* 메시지 목록 */}
          <div className="h-[150px] overflow-y-auto py-1">
            {chatMessages.length === 0 && (
              <div className="px-2.5 py-3 text-center font-mono text-[10px] text-dk-harness-muted/50">
                No messages yet
              </div>
            )}
            {chatMessages.map((msg: ChatMessage) => {
              const color =
                AGENT_SCREEN_COLORS[msg.agentId.toLowerCase()] ??
                (msg.agentId === 'user' ? '#FF6B2C' : '#7070a0');
              return (
                <div
                  key={msg.id}
                  className="mb-px flex items-start gap-1.5 bg-dk-harness-light/50 px-2.5 py-0.5"
                >
                  <span
                    className="shrink-0 whitespace-nowrap font-mono text-[10px] font-bold"
                    style={{ color }}
                  >
                    [{msg.agentName}]
                  </span>
                  <span className="flex-1 break-words font-mono text-[10px] text-dk-harness-dark">
                    {msg.text}
                  </span>
                  <span className="shrink-0 whitespace-nowrap font-mono text-[9px] text-dk-harness-muted/50">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="flex gap-1 border-t border-dk-harness-orange/15 px-2 py-1">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지 입력..."
              disabled={sending}
              aria-label="채팅 입력"
              className="flex-1 border border-dk-harness-orange/20 bg-white px-2 py-1 font-mono text-[11px] text-dk-harness-dark outline-none transition-colors focus:border-dk-harness-orange"
            />
            <button
              onClick={() => void handleSend()}
              disabled={sending || !inputText.trim()}
              aria-label="전송"
              className="shrink-0 cursor-pointer border-none px-2.5 py-1 font-mono text-[10px] transition-colors disabled:cursor-not-allowed disabled:bg-dk-harness-light disabled:text-dk-harness-muted/50"
              style={{
                background: sending || !inputText.trim() ? undefined : '#FF6B2C',
                color: sending || !inputText.trim() ? undefined : '#ffffff',
              }}
            >
              전송
            </button>
          </div>
        </>
      )}
    </div>
  );
}
