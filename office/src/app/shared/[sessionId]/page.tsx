'use client';

import { useEffect, useState, use } from 'react';
import { useSessionEvents } from '@/hooks/useSessionEvents';
import type { AgentEvent, RegisteredSession } from '@/types/session';

export default function SharedSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const [session, setSession] = useState<RegisteredSession | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Session not found');
        return res.json();
      })
      .then((data) => setSession(data.session))
      .catch(() => setError('세션을 찾을 수 없습니다'));
  }, [sessionId]);

  useSessionEvents((event) => {
    if (event.sessionId === sessionId || event.agentName.toLowerCase() === session?.agentName.toLowerCase()) {
      setEvents((prev) => [...prev.slice(-200), event]);
    }
  });

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-white font-sans text-base text-red-500">
        {error}
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center bg-white font-sans text-sm text-dk-harness-orange">
        Loading session...
      </div>
    );
  }

  const statusClass = session.status === 'active' ? 'bg-status-active shadow-[0_0_6px_rgba(34,197,94,0.33)]'
    : session.status === 'idle' ? 'bg-status-idle shadow-[0_0_6px_rgba(234,179,8,0.33)]'
    : session.status === 'waiting' ? 'bg-status-blocked shadow-[0_0_6px_rgba(239,68,68,0.33)]'
    : 'bg-status-offline';

  return (
    <div className="flex h-screen flex-col bg-white font-sans text-dk-harness-dark">
      {/* 헤더 */}
      <div className="flex items-center gap-4 border-b border-dk-harness-orange/15 bg-dk-harness-light px-6 py-4">
        <div className={`h-2.5 w-2.5 rounded-full ${statusClass}`} />
        <div>
          <div className="text-lg font-bold text-dk-harness-dark">{session.agentName}</div>
          <div className="text-xs text-dk-harness-muted">
            {session.agentRole} | {session.teamId} | Session: {sessionId.slice(0, 8)}...
          </div>
        </div>
        {session.sharing?.allowRemoteControl && (
          <div className="ml-auto rounded-full border border-status-active bg-status-active/10 px-3 py-1 text-xs font-semibold text-status-active">
            RC Available
          </div>
        )}
        {session.currentTool && (
          <div className="rounded-full border border-dk-harness-orange bg-dk-harness-orange/10 px-3 py-1 text-xs font-semibold text-dk-harness-orange">
            {session.currentTool}
          </div>
        )}
        <a
          href="/"
          className={`text-[13px] font-semibold text-dk-harness-orange no-underline hover:text-dk-harness-orange-hover ${session.sharing?.allowRemoteControl ? '' : 'ml-auto'}`}
        >
          &larr; Office
        </a>
      </div>

      {/* 이벤트 로그 */}
      <div className="flex-1 overflow-auto px-6 py-3">
        {events.length === 0 ? (
          <div className="mt-15 text-center text-sm text-dk-harness-muted">
            이벤트 대기 중... 이 세션에서 도구를 사용하면 여기에 표시됩니다.
          </div>
        ) : (
          events.map((e, i) => {
            const time = new Date(e.timestamp).toLocaleTimeString();
            const typeColorClass = e.eventType === 'tool_start' ? 'text-blue-500'
              : e.eventType === 'tool_done' ? 'text-status-active'
              : e.eventType === 'status_change' ? 'text-status-idle'
              : 'text-dk-harness-muted';
            return (
              <div key={i} className="border-b border-dk-harness-orange/[0.08] py-1.5 text-[13px]">
                <span className="font-mono text-xs text-dk-harness-muted">{time}</span>
                {' '}
                <span className={`font-mono text-xs font-semibold ${typeColorClass}`}>
                  [{e.eventType}]
                </span>
                {' '}
                {e.toolName && <span className="text-dk-harness-dark">{e.toolName}</span>}
              </div>
            );
          })
        )}
      </div>

      {/* 하단 상태 */}
      <div className="flex justify-between border-t border-dk-harness-orange/15 bg-dk-harness-light px-6 py-2.5 text-[11px] text-dk-harness-muted">
        <span>Events: {events.length}</span>
        <span className="font-mono text-[10px]">
          {typeof window !== 'undefined' ? window.location.href : ''}
        </span>
      </div>
    </div>
  );
}
