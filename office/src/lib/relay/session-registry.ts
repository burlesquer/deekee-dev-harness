import type { RegisteredSession } from '@/types/session';

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

class SessionRegistry {
  private sessions: Map<string, RegisteredSession> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    if (typeof globalThis.setInterval === 'function') {
      this.cleanupTimer = setInterval(() => {
        this.cleanup(DEFAULT_MAX_AGE_MS);
      }, CLEANUP_INTERVAL_MS);
    }
  }

  register(session: RegisteredSession): void {
    this.sessions.set(session.sessionId, session);
  }

  unregister(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getAll(): RegisteredSession[] {
    return Array.from(this.sessions.values());
  }

  getByTeam(teamId: string): RegisteredSession[] {
    return this.getAll().filter((s) => s.teamId === teamId);
  }

  updateStatus(sessionId: string, status: RegisteredSession['status'], tool?: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    this.sessions.set(sessionId, {
      ...session,
      status,
      currentTool: tool ?? session.currentTool,
      lastEventAt: Date.now(),
    });
  }

  cleanup(maxAgeMs: number): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (now - session.lastEventAt > maxAgeMs) {
        this.sessions.delete(id);
      }
    }
  }

  destroy(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Singleton — shared across the server process
const globalForRegistry = globalThis as typeof globalThis & {
  __sessionRegistry?: SessionRegistry;
};

if (!globalForRegistry.__sessionRegistry) {
  globalForRegistry.__sessionRegistry = new SessionRegistry();
}

export const sessionRegistry: SessionRegistry = globalForRegistry.__sessionRegistry;
