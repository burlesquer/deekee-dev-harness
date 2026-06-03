import { randomBytes } from 'crypto';
import { kvEnabled, kvGetJSON, kvSetJSON } from './kv-store';

const DEFAULT_EXPIRES_IN_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const KV_KEY = 'dk:invites';
// 읽기 경로에서 KV 재동기화를 스로틀하는 간격(room-registry 와 동일 전략).
const SYNC_TTL_MS = 3000;

export interface InviteCode {
  code: string;       // e.g. "IRON-7K2X" (항상 4-4 포맷)
  sessionId: string;
  createdBy: string;
  teamId: string;
  expiresAt: number;
  maxUses: number;    // -1 = unlimited
  currentUses: number;
}

/**
 * 초대 코드 레지스트리. KV(dk:invites)를 단일 진실원본으로 두고 in-memory Map 은 캐시로 쓴다.
 * 서버리스 일관성 전략은 room-registry 와 동일하다(읽기 read-through / 쓰기 RMW).
 */
export class InviteRegistry {
  private invites: Map<string, InviteCode> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private lastSyncAt = 0;

  constructor() {
    if (typeof globalThis.setInterval === 'function') {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, CLEANUP_INTERVAL_MS);
    }
  }

  async create(
    sessionId: string,
    createdBy: string,
    teamId: string,
    expiresInMs: number = DEFAULT_EXPIRES_IN_MS,
    maxUses: number = -1,
  ): Promise<InviteCode> {
    await this.refreshFromKV(); // RMW: 최신 KV 반영 후 코드 충돌 검사 + 병합
    const code = this.generateUniqueCode(createdBy);

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
    await this.persist();
    return invite;
  }

  async validate(code: string): Promise<InviteCode | null> {
    await this.ensureFresh();
    return this.validateInMemory(code);
  }

  async use(code: string): Promise<InviteCode | null> {
    await this.refreshFromKV();
    const invite = this.validateInMemory(code);
    if (!invite) return null;

    const updated: InviteCode = {
      ...invite,
      currentUses: invite.currentUses + 1,
    };
    this.invites.set(code, updated);
    await this.persist();
    return updated;
  }

  /** 만료/사용횟수 검사만 수행(동기). 호출 전 동기화가 끝났다고 가정한다. */
  private validateInMemory(code: string): InviteCode | null {
    const invite = this.invites.get(code);
    if (!invite) return null;
    if (Date.now() > invite.expiresAt) return null;
    if (invite.maxUses !== -1 && invite.currentUses >= invite.maxUses) return null;
    return invite;
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
  async seed(invite: InviteCode): Promise<void> {
    await this.refreshFromKV();
    this.invites.set(invite.code, invite);
    await this.persist();
  }

  destroy(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /** Restore invites from KV into the Map. */
  async hydrate(): Promise<void> {
    await this.refreshFromKV();
  }

  /** Snapshot all invites to KV. Awaited by writers; no-op when KV is disabled. */
  async persist(): Promise<void> {
    if (!kvEnabled()) return;
    await kvSetJSON(KV_KEY, Array.from(this.invites.values()));
  }

  /** KV 스냅샷을 메모리(invites)로 통째 재구성한다. */
  private async refreshFromKV(): Promise<void> {
    if (!kvEnabled()) return;
    const stored = await kvGetJSON<InviteCode[]>(KV_KEY);
    this.lastSyncAt = Date.now();
    const invites = new Map<string, InviteCode>();
    if (Array.isArray(stored)) {
      for (const invite of stored) {
        invites.set(invite.code, invite);
      }
    }
    this.invites = invites;
  }

  /** 읽기 직전 TTL 스로틀 동기화: warm 인스턴스의 stale 읽기를 방지. */
  private async ensureFresh(): Promise<void> {
    if (!kvEnabled()) return;
    if (Date.now() - this.lastSyncAt < SYNC_TTL_MS) return;
    await this.refreshFromKV();
  }

  /**
   * 코드 생성. 항상 4-4 포맷(`PREFIX-SUFFIX`)으로 정규화한다.
   * 프리픽스는 createdBy 의 영숫자 4자(짧으면 hex 로 패딩), 서픽스는 4 hex.
   * join 입력(InviteCodeInput)이 정확히 8자(4-4)만 받기 때문에 길이를 고정한다.
   */
  private generateCode(createdBy: string): string {
    const clean = createdBy.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const hex = randomBytes(4).toString('hex').toUpperCase(); // 8 hex chars
    const prefix = (clean + hex).slice(0, 4);
    const suffix = hex.slice(-4);
    return `${prefix}-${suffix}`;
  }

  private generateUniqueCode(createdBy: string): string {
    let code = this.generateCode(createdBy);
    while (this.invites.has(code)) {
      code = this.generateCode(createdBy);
    }
    return code;
  }
}

// Singleton — shared across the server process (globalThis pattern)
const globalForInvite = globalThis as typeof globalThis & {
  __inviteRegistry?: InviteRegistry;
};

if (!globalForInvite.__inviteRegistry) {
  const registry = new InviteRegistry();
  // 콜드스타트 시 KV 스냅샷을 미리 로드(베스트 에포트). 읽기 경로의 read-through 가
  // 다시 동기화하므로 await 하지 않는다(top-level await 제거 → 번들/ts-jest 양립).
  void registry.hydrate();
  globalForInvite.__inviteRegistry = registry;

  // Seed a fixed demo invite code for development / local testing
  if (process.env.NODE_ENV !== 'production') {
    const DEV_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year
    void registry.seed({
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
