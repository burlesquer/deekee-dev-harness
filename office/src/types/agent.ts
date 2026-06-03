export interface AgentState {
  id: string;
  name: string;
  role: string;
  status: 'idle' | 'working' | 'reviewing' | 'blocked';
  position: { x: number; y: number; z: number };
  currentTool?: string;
}
