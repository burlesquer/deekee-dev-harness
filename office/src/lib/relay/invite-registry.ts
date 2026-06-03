import { randomBytes } from 'crypto';
import { kvEnabled, kvGetJSON, kvSetJSON } from './kv-store';

const DEFAULT_EXPIRES_IN_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const KV_KEY = 'dk:invites';

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
    void this.persist();
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
    void this.persist();
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
    void this.persist();
  }

  destroy(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /** Restore invites from KV into the Map (call once at startup). */
  async hydrate(): Promise<void> {
    const stored = await kvGetJSON<InviteCode[]>(KV_KEY);
    if (!stored || !Array.isArray(stored)) return;
    for (const invite of stored) {
      this.invites.set(invite.code, invite);
    }
  }

  /** Snapshot all invites to KV. Fire-and-forget; errors are swallowed. */
  persist(): void {
    if (!kvEnabled()) return;
    void kvSetJSON(KV_KEY, Array.from(this.invites.values())).catch(() => {});
  }
}

// Singleton — shared across the server process (globalThis pattern)
const globalForInvite = globalThis as typeof globalThis & {
  __inviteRegistry?: InviteRegistry;
};

if (!globalForInvite.__inviteRegistry) {
  const registry = new InviteRegistry();
  // Restore persisted invites before the singleton is exposed so route handlers
  // (which import this module) see a hydrated registry on the first request.
  if (kvEnabled()) await registry.hydrate();
  globalForInvite.__inviteRegistry = registry;

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
