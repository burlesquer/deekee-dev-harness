import { create } from 'zustand';
import type { AgentState } from '@/types/agent';
import type { RegisteredSession, ApprovalRequest } from '@/types/session';
import type { Room } from '@/lib/relay/room-registry';

export interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  text: string;
  timestamp: number;
}

interface OfficeStore {
  agents: Map<string, AgentState>;
  selectedAgentId: string | null;
  sessions: Map<string, RegisteredSession>;
  sidebarOpen: boolean;
  hoveredAgentId: string | null;

  // Chat state
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;

  // Room state
  currentRoomId: string | null;
  currentRoom: Room | null;
  setCurrentRoom: (room: Room | null) => void;

  // Project/pipeline state
  projectName: string | null;
  pipelinePhase: string | null;
  setProjectName: (name: string) => void;
  setPipelinePhase: (phase: string) => void;

  // Approval state
  approvals: ApprovalRequest[];
  activeApprovalId: string | null;

  // Agent actions
  addAgent: (agent: AgentState) => void;
  removeAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<AgentState>) => void;
  selectAgent: (id: string | null) => void;

  // Session actions
  addSession: (session: RegisteredSession) => void;
  removeSession: (sessionId: string) => void;
  updateSessionStatus: (
    sessionId: string,
    status: RegisteredSession['status'],
    currentTool?: string,
  ) => void;

  // UI actions
  toggleSidebar: () => void;
  setHoveredAgent: (id: string | null) => void;

  // Approval actions
  addApproval: (approval: ApprovalRequest) => void;
  removeApproval: (id: string) => void;
  setActiveApproval: (id: string | null) => void;
}

export const useOfficeStore = create<OfficeStore>((set) => ({
  agents: new Map(),
  selectedAgentId: null,
  sessions: new Map(),
  sidebarOpen: true,
  hoveredAgentId: null,
  currentRoomId: null,
  currentRoom: null,
  projectName: null,
  pipelinePhase: null,
  approvals: [],
  activeApprovalId: null,
  chatMessages: [],

  addAgent: (agent) =>
    set((state) => {
      const next = new Map(state.agents);
      next.set(agent.id, agent);
      return { agents: next };
    }),

  removeAgent: (id) =>
    set((state) => {
      const next = new Map(state.agents);
      next.delete(id);
      return { agents: next };
    }),

  updateAgent: (id, updates) =>
    set((state) => {
      const agent = state.agents.get(id);
      if (!agent) return state;
      const next = new Map(state.agents);
      next.set(id, { ...agent, ...updates });
      return { agents: next };
    }),

  selectAgent: (id) => set({ selectedAgentId: id }),

  setCurrentRoom: (room) => set({ currentRoom: room, currentRoomId: room?.id ?? null }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setHoveredAgent: (id) => set({ hoveredAgentId: id }),

  addSession: (session) =>
    set((state) => {
      const next = new Map(state.sessions);
      next.set(session.sessionId, session);
      return { sessions: next };
    }),

  removeSession: (sessionId) =>
    set((state) => {
      const next = new Map(state.sessions);
      next.delete(sessionId);
      return { sessions: next };
    }),

  updateSessionStatus: (sessionId, status, currentTool) =>
    set((state) => {
      const session = state.sessions.get(sessionId);
      if (!session) return state;
      const next = new Map(state.sessions);
      next.set(sessionId, {
        ...session,
        status,
        currentTool: currentTool ?? session.currentTool,
        lastEventAt: Date.now(),
      });
      return { sessions: next };
    }),

  setProjectName: (name) => set({ projectName: name }),
  setPipelinePhase: (phase) => set({ pipelinePhase: phase }),

  addApproval: (approval) =>
    set((state) => ({
      approvals: [...state.approvals.filter((a) => a.id !== approval.id), approval],
    })),

  removeApproval: (id) =>
    set((state) => ({
      approvals: state.approvals.filter((a) => a.id !== id),
      activeApprovalId: state.activeApprovalId === id ? null : state.activeApprovalId,
    })),

  setActiveApproval: (id) => set({ activeApprovalId: id }),

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages.slice(-199), msg],
    })),
}));
