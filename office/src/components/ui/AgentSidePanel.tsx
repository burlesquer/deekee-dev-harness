'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOfficeStore } from '@/stores/office-store';
import { ChatPanel } from '@/components/chat/ChatPanel';

const STATUS_COLOR: Record<string, string> = {
  active: '#22c55e',
  idle: '#eab308',
  waiting: '#ef4444',
  blocked: '#ef4444',
  completed: '#6b7280',
};

const STATUS_LABEL: Record<string, string> = {
  active: 'active',
  idle: 'idle',
  waiting: 'waiting',
  blocked: 'blocked',
  completed: 'offline',
};

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor((Date.now() - ms) / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function truncateTool(tool?: string): string {
  if (!tool) return '';
  return tool.length > 22 ? tool.slice(0, 19) + '...' : tool;
}

interface RoomInfo {
  id: string;
  name: string;
  code: string;
  isPublic: boolean;
  memberCount: number;
  maxMembers: number;
}

export interface AgentSidePanelProps {
  readonly roomId?: string;
}

export function AgentSidePanel({ roomId }: Readonly<AgentSidePanelProps>) {
  const sessions = useOfficeStore((s) => s.sessions);
  const selectedAgentId = useOfficeStore((s) => s.selectedAgentId);
  const sidebarOpen = useOfficeStore((s) => s.sidebarOpen);
  const toggleSidebar = useOfficeStore((s) => s.toggleSidebar);
  const selectAgent = useOfficeStore((s) => s.selectAgent);
  const approvals = useOfficeStore((s) => s.approvals);
  const setActiveApproval = useOfficeStore((s) => s.setActiveApproval);

  const router = useRouter();
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const sessionList = Array.from(sessions.values());

  useEffect(() => {
    if (!roomId) {
      setRoomInfo(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/rooms/${encodeURIComponent(roomId)}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json() as Promise<RoomInfo>;
      })
      .then((data) => {
        if (!cancelled && data) setRoomInfo(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const handleCopyCode = useCallback(async () => {
    if (!roomInfo) return;
    try {
      await navigator.clipboard.writeText(roomInfo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [roomInfo]);

  const handleLeaveRoom = useCallback(() => {
    router.push('/');
  }, [router]);

  return (
    <div
      className="relative flex shrink-0 flex-col overflow-hidden border-r border-dk-harness-orange/15 bg-white transition-[width] duration-150"
      style={{ width: sidebarOpen ? 256 : 32 }}
    >
      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        title={sidebarOpen ? 'Collapse' : 'Expand'}
        className="absolute right-1.5 top-2 z-10 flex h-5 w-5 cursor-pointer items-center justify-center border border-dk-harness-orange/20 bg-dk-harness-light text-[10px] text-dk-harness-muted hover:border-dk-harness-orange hover:text-dk-harness-orange"
      >
        {sidebarOpen ? '‹' : '›'}
      </button>

      {sidebarOpen && (
        <>
          {/* Room info card */}
          {roomId && (
            <div className="mx-2 mt-2.5 shrink-0 border border-dk-harness-orange bg-dk-harness-light p-2.5 pb-2">
              <div className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[11px] font-bold tracking-wider text-dk-harness-orange">
                {roomInfo ? roomInfo.code : roomId}
              </div>
              {roomInfo && (
                <div className="mb-1.5 overflow-hidden text-ellipsis whitespace-nowrap font-sans text-xs text-dk-harness-dark">
                  {roomInfo.name}
                </div>
              )}
              {roomInfo && (
                <div className="mb-2 flex gap-2 font-mono text-[10px] text-dk-harness-muted/50">
                  <span>{roomInfo.memberCount}/{roomInfo.maxMembers} members</span>
                  <span className="text-dk-harness-orange/20">|</span>
                  <span className={roomInfo.isPublic ? 'text-status-active' : 'text-status-offline'}>
                    {roomInfo.isPublic ? 'Public' : 'Private'}
                  </span>
                </div>
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={handleCopyCode}
                  aria-label="룸 코드 복사"
                  className="flex-1 cursor-pointer border border-dk-harness-orange/20 bg-transparent py-0.5 font-mono text-[9px] tracking-wider text-dk-harness-muted transition-colors hover:border-dk-harness-orange hover:text-dk-harness-orange"
                  style={copied ? { borderColor: '#22c55e', color: '#22c55e', background: '#f0fdf4' } : undefined}
                >
                  {copied ? '[복사됨]' : '코드 복사'}
                </button>
                <button
                  onClick={handleLeaveRoom}
                  aria-label="룸 나가기"
                  className="flex-1 cursor-pointer border border-dk-harness-orange/20 bg-transparent py-0.5 font-mono text-[9px] tracking-wider text-dk-harness-muted transition-colors hover:border-status-blocked hover:text-status-blocked"
                >
                  나가기
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div
            className="border-b border-dk-harness-orange/15 px-3 pb-2 pr-8 pt-2.5 font-mono text-[11px] uppercase tracking-wider text-dk-harness-muted"
            style={{ marginTop: roomId ? '8px' : 0 }}
          >
            Agents
          </div>

          {/* Agent list */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {sessionList.length === 0 && (
              <div className="px-3 py-4 text-center font-mono text-[11px] text-dk-harness-muted/40">
                No active sessions
              </div>
            )}
            {sessionList.map((session) => {
              const isSelected = selectedAgentId === session.sessionId;
              const statusColor = STATUS_COLOR[session.status] ?? '#6b7280';
              const pendingApproval = approvals.find(
                (a) =>
                  a.status === 'pending' &&
                  a.agentName.toLowerCase() === session.agentName.toLowerCase(),
              );

              return (
                <button
                  key={session.sessionId}
                  onClick={() => {
                    if (pendingApproval) {
                      setActiveApproval(pendingApproval.id);
                    } else {
                      selectAgent(isSelected ? null : session.sessionId);
                    }
                  }}
                  className="block w-full cursor-pointer border-none text-left"
                  style={{
                    background: isSelected ? '#FFF8F3' : 'transparent',
                    borderBottom: '1px solid rgba(255, 107, 44, 0.08)',
                    borderLeft: isSelected ? `2px solid ${statusColor}` : '2px solid transparent',
                    padding: '8px 10px',
                  }}
                >
                  {/* Row 1: status dot + name + status */}
                  <div className="mb-0.5 flex items-center gap-1.5">
                    <span
                      className="shrink-0 rounded-full"
                      style={{
                        width: 7,
                        height: 7,
                        background: statusColor,
                        boxShadow: session.status === 'active' ? `0 0 4px ${statusColor}` : 'none',
                      }}
                    />
                    <span className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-sans text-xs font-semibold ${isSelected ? 'text-dk-harness-dark' : 'text-dk-harness-dark/80'}`}>
                      {session.agentName}
                    </span>
                    {pendingApproval && (
                      <span className="shrink-0 bg-status-blocked px-1 py-px text-[8px] font-bold text-white" title="Pending approval">
                        &#9888;
                      </span>
                    )}
                    <span
                      className="font-mono text-[9px] uppercase"
                      style={{ color: pendingApproval ? '#ef4444' : statusColor }}
                    >
                      {pendingApproval ? 'approval' : (STATUS_LABEL[session.status] ?? session.status)}
                    </span>
                  </div>

                  {/* Row 2: role */}
                  <div className="mb-0.5 pl-3.5 font-mono text-[10px] text-dk-harness-muted">
                    {session.agentRole}
                  </div>

                  {/* Row 3: current tool */}
                  {session.currentTool && (
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap pl-3.5 font-mono text-[10px] text-dk-harness-orange">
                      {truncateTool(session.currentTool)}
                    </div>
                  )}

                  {/* Row 4: elapsed time */}
                  <div className="mt-0.5 pl-3.5 font-mono text-[9px] text-dk-harness-muted/40">
                    {formatElapsed(session.registeredAt)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Chat panel */}
          <ChatPanel roomId={roomId} />
        </>
      )}
    </div>
  );
}
