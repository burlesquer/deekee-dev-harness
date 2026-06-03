export interface SessionSharing {
  enabled: boolean;
  allowRemoteControl: boolean;
  remoteControlUrl?: string | null;
}

export interface RegisteredSession {
  sessionId: string;
  userId: string;
  agentRole: string;
  agentName: string;
  teamId?: string;
  status: 'active' | 'idle' | 'waiting' | 'completed';
  currentTool?: string;
  sessionTitle?: string;
  remoteControlUrl?: string;
  sharing?: SessionSharing;
  registeredAt: number;
  lastEventAt: number;
}

export interface AgentEvent {
  teamId: string;
  sessionId: string;
  userId: string;
  agentName: string;
  roomId?: string;
  eventType:
    | 'register'
    | 'tool_start'
    | 'tool_done'
    | 'status_change'
    | 'unregister'
    | 'approval_request'
    | 'approval_resolved'
    | 'chat_message';
  toolName?: string;
  timestamp: number;
  payload?: Record<string, unknown>;
}

export interface ApprovalRequest {
  id: string;
  sessionId: string;
  agentName: string;
  toolName: string;
  command: string;
  description?: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: number;
  decidedAt?: number;
  decidedBy?: string;
  reason?: string;
}
