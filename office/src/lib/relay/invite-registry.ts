import { randomBytes } from 'crypto';

const DEFAULT_EXPIRES_IN_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export interface InviteCode {
  code: string;       // e.g. "IRON-7K2X"
  sessionId: string;
  createdBy: string;
  teamId: string;
  expiresAt: number;
  maxUses: number;    // -1 = unlimited
  currentUses: number;
}

export class InviteRegistry {
  private invites: Map<string, InviteCode> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof globalThis.setInterval === 'function') {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, CLEANUP_INTERVAL_MS);
    }
  }

  create(
    sessionId: string,
    createdBy: string,
    teamId: string,
    expiresInMs: number = DEFAULT_EXPIRES_IN_MS,
    maxUses: number = -1,
  ): InviteCode {
    const hex = randomBytes(2).toString('hex').toUpperCase();
    const code = `${createdBy.toUpperCase()}-${hex}`;

    const invite: InviteCode = {
      code,
      sessionId,
      createdBy,
      teamId,
      expiresAt: Date.now() + expiresInMs,
      maxUses,
      currentUses: 0,
    };

    this.invites.set(code, invite);
    return invite;
  }

  validate(code: string): InviteCode | null {
    const invite = this.invites.get(code);
    if (!invite) return null;
    if (Date.now() > invite.expiresAt) return null;
    if (invite.maxUses !== -1 && invite.currentUses >= invite.maxUses) return null;
    return invite;
  }

  use(code: string): InviteCode | null {
    const invite = this.validate(code);
    if (!invite) return null;

    const updated: InviteCode = {
      ...invite,
      currentUses: invite.currentUses + 1,
    };
    this.invites.set(code, updated);
    return updated;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [code, invite] of this.invites) {
      if (now > invite.expiresAt) {
        this.invites.delete(code);
      }
    }
  }

  /** Directly insert a pre-built invite (used for seeding in dev/test). */
  seed(invite: InviteCode): void {
    this.invites.set(invite.code, invite);
  }

  destroy(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Singleton — shared across the server process (globalThis pattern)
const globalForInvite = globalThis as typeof globalThis & {
  __inviteRegistry?: InviteRegistry;
};

if (!globalForInvite.__inviteRegistry) {
  globalForInvite.__inviteRegistry = new InviteRegistry();

  // Seed a fixed demo invite code for development / local testing
  if (process.env.NODE_ENV !== 'production') {
    const DEV_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year
    globalForInvite.__inviteRegistry.seed({
      code: 'IRON-7K2X',
      sessionId: 'demo-session-001',
      createdBy: 'IRON',
      teamId: 'dev-team',
      expiresAt: Date.now() + DEV_TTL_MS,
      maxUses: -1,
      currentUses: 0,
    });
  }
}

export const inviteRegistry: InviteRegistry = globalForInvite.__inviteRegistry;
