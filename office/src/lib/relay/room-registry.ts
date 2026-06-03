import { randomBytes } from 'crypto';
import { kvEnabled, kvGetJSON, kvSetJSON } from './kv-store';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const EMPTY_ROOM_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
const KV_KEY = 'dk:rooms';
// 읽기 경로에서 KV 재동기화를 스로틀하는 간격. warm 서버리스 인스턴스가
// 다른 인스턴스의 변경을 이 시간 안에 따라잡는다(latency vs staleness 트레이드오프).
const SYNC_TTL_MS = 3000;

export interface RoomMember {
  sessionId: string;
  userId: string;
  agentName: string;
  agentRole: string;
  joinedAt: number;
}

export interface RoomSettings {
  maxMembers: number;
  isPublic: boolean;
  allowSpectators: boolean;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  ownerId: string;
  teamId: string;
  members: RoomMember[];
  createdAt: number;
  settings: RoomSettings;
}

function generateRoomCode(): string {
  const hex = randomBytes(2).toString('hex').toUpperCase();
  return `DK-${hex}`;
}

function generateId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * 룸 레지스트리. KV(dk:rooms)를 단일 진실원본으로 두고 in-memory Map 은 캐시로 쓴다.
 *
 * 서버리스 일관성 전략:
 *  - 읽기: ensureFresh() 로 TTL 스로틀 read-through → warm 인스턴스도 stale 하지 않게 한다.
 *  - 쓰기: refreshFromKV() 로 최신 KV 를 먼저 반영한 뒤(read-modify-write) 변경하고 persist().
 *    이렇게 해야 stale 스냅샷을 통째로 덮어써 남의 룸을 지우는 데이터 손실을 막는다.
 *
 * KV 가 비활성(로컬/콜드)이면 모든 동기화는 no-op 이고 순수 in-memory 로 동작한다.
 */
export class RoomRegistry {
  private rooms: Map<string, Room> = new Map();
  private codeIndex: Map<string, string> = new Map(); // code -> roomId
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
    name: string,
    ownerId: string,
    teamId: string,
    settings?: Partial<RoomSettings>,
  ): Promise<Room> {
    await this.refreshFromKV(); // RMW: 최신 KV 반영 후 코드 충돌 검사 + 병합
    const id = generateId();
    const code = this.generateUniqueCode();

    const room: Room = {
      id,
      code,
      name,
      ownerId,
      teamId,
      members: [],
      createdAt: Date.now(),
      settings: {
        maxMembers: settings?.maxMembers ?? 10,
        isPublic: settings?.isPublic ?? false,
        allowSpectators: settings?.allowSpectators ?? false,
      },
    };

    this.rooms.set(id, room);
    this.codeIndex.set(code, id);
    await this.persist();
    return room;
  }

  async join(code: string, member: RoomMember): Promise<Room | null> {
    await this.refreshFromKV();
    const roomId = this.codeIndex.get(code);
    if (!roomId) return null;
    return this.applyJoin(roomId, member);
  }

  async joinById(roomId: string, member: RoomMember): Promise<Room | null> {
    await this.refreshFromKV();
    return this.applyJoin(roomId, member);
  }

  /** join/joinById 공통 멤버 추가 로직. 호출 전 refreshFromKV 가 끝났다고 가정한다. */
  private async applyJoin(roomId: string, member: RoomMember): Promise<Room | null> {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Check capacity
    const spectatorCount = room.settings.allowSpectators ? 0 : 0;
    const memberCount = room.members.length - spectatorCount;
    if (memberCount >= room.settings.maxMembers) return null;

    // Remove existing session if rejoining
    const existing = room.members.findIndex((m) => m.sessionId === member.sessionId);
    const updatedMembers =
      existing >= 0
        ? [...room.members.slice(0, existing), member, ...room.members.slice(existing + 1)]
        : [...room.members, member];

    const updated: Room = { ...room, members: updatedMembers };
    this.rooms.set(roomId, updated);
    await this.persist();
    return updated;
  }

  async leave(roomId: string, sessionId: string): Promise<boolean> {
    await this.refreshFromKV();
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const before = room.members.length;
    const updated: Room = {
      ...room,
      members: room.members.filter((m) => m.sessionId !== sessionId),
    };
    this.rooms.set(roomId, updated);
    await this.persist();
    return updated.members.length < before;
  }

  async delete(roomId: string): Promise<boolean> {
    await this.refreshFromKV();
    const room = this.rooms.get(roomId);
    if (!room) return false;
    this.codeIndex.delete(room.code);
    this.rooms.delete(roomId);
    await this.persist();
    return true;
  }

  async getByCode(code: string): Promise<Room | null> {
    await this.ensureFresh();
    const roomId = this.codeIndex.get(code);
    if (!roomId) return null;
    return this.rooms.get(roomId) ?? null;
  }

  async getById(roomId: string): Promise<Room | null> {
    await this.ensureFresh();
    return this.rooms.get(roomId) ?? null;
  }

  async getAll(): Promise<Room[]> {
    await this.ensureFresh();
    return this.snapshot();
  }

  async getPublicRooms(): Promise<Room[]> {
    await this.ensureFresh();
    return this.snapshot().filter((r) => r.settings.isPublic);
  }

  async getByMember(sessionId: string): Promise<Room[]> {
    await this.ensureFresh();
    return this.snapshot().filter((r) => r.members.some((m) => m.sessionId === sessionId));
  }

  async getByUserId(userId: string): Promise<Room[]> {
    await this.ensureFresh();
    return this.snapshot().filter((r) => r.members.some((m) => m.userId === userId));
  }

  cleanup(): void {
    const now = Date.now();
    for (const [id, room] of this.rooms) {
      if (room.members.length === 0 && now - room.createdAt > EMPTY_ROOM_MAX_AGE_MS) {
        this.codeIndex.delete(room.code);
        this.rooms.delete(id);
      }
    }
  }

  destroy(): void {
    if (this.cleanupTimer !== null) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /** Restore rooms from KV into the Map + code index. */
  async hydrate(): Promise<void> {
    await this.refreshFromKV();
  }

  /** Snapshot all rooms to KV. Awaited by writers; no-op when KV is disabled. */
  async persist(): Promise<void> {
    if (!kvEnabled()) return;
    await kvSetJSON(KV_KEY, this.snapshot());
  }

  /** 현재 메모리 룸들의 sync 스냅샷(내부 전용). */
  private snapshot(): Room[] {
    return Array.from(this.rooms.values());
  }

  /** KV 스냅샷을 메모리(rooms + codeIndex)로 통째 재구성한다. */
  private async refreshFromKV(): Promise<void> {
    if (!kvEnabled()) return;
    const stored = await kvGetJSON<Room[]>(KV_KEY);
    this.lastSyncAt = Date.now();
    const rooms = new Map<string, Room>();
    const codeIndex = new Map<string, string>();
    if (Array.isArray(stored)) {
      for (const room of stored) {
        rooms.set(room.id, room);
        codeIndex.set(room.code, room.id);
      }
    }
    this.rooms = rooms;
    this.codeIndex = codeIndex;
  }

  /** 읽기 직전 TTL 스로틀 동기화: warm 인스턴스의 stale 읽기를 방지. */
  private async ensureFresh(): Promise<void> {
    if (!kvEnabled()) return;
    if (Date.now() - this.lastSyncAt < SYNC_TTL_MS) return;
    await this.refreshFromKV();
  }

  private generateUniqueCode(): string {
    let code = generateRoomCode();
    // Retry on collision (extremely rare with 4 hex bytes = 65536 possibilities)
    while (this.codeIndex.has(code)) {
      code = generateRoomCode();
    }
    return code;
  }
}

// Singleton — shared across the server process (globalThis pattern)
const globalForRoom = globalThis as typeof globalThis & {
  __roomRegistry?: RoomRegistry;
};

if (!globalForRoom.__roomRegistry) {
  const registry = new RoomRegistry();
  // 콜드스타트 시 KV 스냅샷을 미리 로드(베스트 에포트). 실패하거나 늦어도
  // 읽기 경로의 read-through(ensureFresh)가 다시 동기화하므로 await 하지 않는다.
  void registry.hydrate();
  globalForRoom.__roomRegistry = registry;
}

export const roomRegistry: RoomRegistry = globalForRoom.__roomRegistry;
