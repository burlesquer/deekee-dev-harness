'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useOfficeStore } from '@/stores/office-store';
import { AgentSidePanel } from '@/components/ui/AgentSidePanel';
import { StatusBar } from '@/components/ui/StatusBar';
import { TerminalPanel } from '@/components/terminal/TerminalPanel';
import { ApprovalModal } from '@/components/ui/ApprovalModal';
import { useSessionEvents } from '@/hooks/useSessionEvents';
import type { AgentEvent, ApprovalRequest, RegisteredSession } from '@/types/session';

const OfficeCanvas = dynamic(
  () => import('@/components/office/OfficeCanvas'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#0a0a0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FF6B2C',
          fontFamily: 'monospace',
        }}
      >
        Loading 3D Office...
      </div>
    ),
  },
);

const TERMINAL_EVENT_TYPES = new Set([
  'tool_start',
  'tool_done',
  'status_change',
  'register',
  'unregister',
]);

export interface OfficeViewProps {
  readonly sessionId?: string;
  readonly roomId?: string;
  readonly projectName?: string;
  readonly userName?: string;
  readonly teamId?: string;
  readonly initialAgents?: Array<{ name: string; actions: number; status: string }>;
  readonly initialPipeline?: { phase: string; task: string; progress: number | null };
}

export function OfficeView({ roomId, projectName, initialAgents, initialPipeline }: Readonly<OfficeViewProps>) {
  const selectedAgentId = useOfficeStore((s) => s.selectedAgentId);
  const selectAgent = useOfficeStore((s) => s.selectAgent);
  const approvals = useOfficeStore((s) => s.approvals);
  const activeApprovalId = useOfficeStore((s) => s.activeApprovalId);
  const addApproval = useOfficeStore((s) => s.addApproval);
  const removeApproval = useOfficeStore((s) => s.removeApproval);
  const setActiveApproval = useOfficeStore((s) => s.setActiveApproval);
  const addSession = useOfficeStore((s) => s.addSession);
  const removeSession = useOfficeStore((s) => s.removeSession);
  const updateSessionStatus = useOfficeStore((s) => s.updateSessionStatus);
  const addChatMessage = useOfficeStore((s) => s.addChatMessage);
  const setProjectName = useOfficeStore((s) => s.setProjectName);
  const setPipelinePhase = useOfficeStore((s) => s.setPipelinePhase);

  const [terminalEvents, setTerminalEvents] = useState<AgentEvent[]>([]);

  // Initialize store from URL-provided props on mount
  useEffect(() => {
    if (projectName) setProjectName(projectName);
  }, [projectName, setProjectName]);

  useEffect(() => {
    if (initialPipeline?.phase) setPipelinePhase(initialPipeline.phase);
  }, [initialPipeline, setPipelinePhase]);

  useEffect(() => {
    if (!initialAgents || initialAgents.length === 0) return;
    const now = Date.now();
    initialAgents.forEach((agent, index) => {
      const session: RegisteredSession = {
        sessionId: `init-${index}-${agent.name}`,
        userId: 'url-init',
        agentRole: agent.name,
        agentName: agent.name,
        status: (agent.status as RegisteredSession['status']) ?? 'idle',
        registeredAt: now,
        lastEventAt: now,
      };
      addSession(session);
    });
  // Run only on initial mount — initialAgents is from URL params and won't change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEvent = useCallback(
    (event: AgentEvent) => {
      // Filter events by roomId when in room mode
      if (roomId && event.roomId && event.roomId !== roomId) return;

      if (event.eventType === 'approval_request') {
        const approval = event.payload?.approval as ApprovalRequest | undefined;
        if (approval) addApproval(approval);
      } else if (event.eventType === 'approval_resolved') {
        const approval = event.payload?.approval as ApprovalRequest | undefined;
        if (approval) {
          addApproval(approval);
          setTimeout(() => removeApproval(approval.id), 2000);
        }
      } else if (event.eventType === 'register') {
        const session = event.payload?.session;
        if (session) addSession(session as Parameters<typeof addSession>[0]);
      } else if (event.eventType === 'unregister') {
        removeSession(event.sessionId);
      } else if (event.eventType === 'tool_start') {
        updateSessionStatus(event.sessionId, 'active', event.toolName);
      } else if (event.eventType === 'tool_done') {
        updateSessionStatus(event.sessionId, 'idle', undefined);
      } else if (event.eventType === 'status_change') {
        const status = event.payload?.status as Parameters<typeof updateSessionStatus>[1] | undefined;
        if (status) updateSessionStatus(event.sessionId, status);
      } else if (event.eventType === 'chat_message') {
        const agentId = (event.payload?.agentId as string) ?? event.sessionId;
        const agentName = (event.payload?.agentName as string) ?? event.agentName;
        const text = event.payload?.text as string | undefined;
        if (text) {
          addChatMessage({
            id: `${event.timestamp}-${agentId}`,
            agentId,
            agentName,
            text,
            timestamp: event.timestamp,
          });
        }
      }

      if (TERMINAL_EVENT_TYPES.has(event.eventType)) {
        setTerminalEvents((prev) => [...prev, event]);
      }
    },
    [roomId, addApproval, removeApproval, addSession, removeSession, updateSessionStatus, addChatMessage],
  );

  useSessionEvents(handleEvent);

  const activeApproval = activeApprovalId
    ? approvals.find((a) => a.id === activeApprovalId)
    : null;

  const filteredTerminalEvents = selectedAgentId
    ? terminalEvents.filter(
        (e) =>
          e.sessionId === selectedAgentId ||
          e.agentName.toLowerCase() === selectedAgentId.toLowerCase(),
      )
    : [];

  return (
    <div
      className="flex h-screen overflow-hidden bg-white"
    >
      {/* Left sidebar */}
      <AgentSidePanel roomId={roomId} />

      {/* Main column: canvas + terminal + statusbar */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {/* 3D canvas */}
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <OfficeCanvas />
        </div>

        {/* Terminal panel — shown when an agent is selected */}
        {selectedAgentId && (
          <TerminalPanel
            agentId={selectedAgentId}
            onClose={() => selectAgent(null)}
            events={filteredTerminalEvents}
          />
        )}

        {/* Status bar */}
        <StatusBar />
      </div>

      {/* Approval modal */}
      {activeApproval && (
        <ApprovalModal
          approval={activeApproval}
          onClose={() => setActiveApproval(null)}
        />
      )}
    </div>
  );
}
