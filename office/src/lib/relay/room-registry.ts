import { randomBytes } from 'crypto';
import { kvEnabled, kvGetJSON, kvSetJSON } from './kv-store';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
const EMPTY_ROOM_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour
const KV_KEY = 'dk:rooms';

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

class RoomRegistry {
  private rooms: Map<string, Room> = new Map();
  private codeIndex: Map<string, string> = new Map(); // code -> roomId
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (typeof globalThis.setInterval === 'function') {
      this.cleanupTimer = setInterval(() => {
        this.cleanup();
      }, CLEANUP_INTERVAL_MS);
    }
  }

  create(
    name: string,
    ownerId: string,
    teamId: string,
    settings?: Partial<RoomSettings>,
  ): Room {
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
    void this.persist();
    return room;
  }

  join(code: string, member: RoomMember): Room | null {
    const roomId = this.codeIndex.get(code);
    if (!roomId) return null;
    return this.joinById(roomId, member);
  }

  joinById(roomId: string, member: RoomMember): Room | null {
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
    void this.persist();
    return updated;
  }

  leave(roomId: string, sessionId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const before = room.members.length;
    const updated: Room = {
      ...room,
      members: room.members.filter((m) => m.sessionId !== sessionId),
    };
    this.rooms.set(roomId, updated);
    void this.persist();
    return updated.members.length < before;
  }

  delete(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    this.codeIndex.delete(room.code);
    this.rooms.delete(roomId);
    void this.persist();
    return true;
  }

  getByCode(code: string): Room | null {
    const roomId = this.codeIndex.get(code);
    if (!roomId) return null;
    return this.rooms.get(roomId) ?? null;
  }

  getById(roomId: string): Room | null {
    return this.rooms.get(roomId) ?? null;
  }

  getAll(): Room[] {
    return Array.from(this.rooms.values());
  }

  getPublicRooms(): Room[] {
    return this.getAll().filter((r) => r.settings.isPublic);
  }

  getByMember(sessionId: string): Room[] {
    return this.getAll().filter((r) => r.members.some((m) => m.sessionId === sessionId));
  }

  getByUserId(userId: string): Room[] {
    return this.getAll().filter((r) => r.members.some((m) => m.userId === userId));
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

  /** Restore rooms from KV into the Map + code index (call once at startup). */
  async hydrate(): Promise<void> {
    const stored = await kvGetJSON<Room[]>(KV_KEY);
    if (!stored || !Array.isArray(stored)) return;
    for (const room of stored) {
      this.rooms.set(room.id, room);
      this.codeIndex.set(room.code, room.id);
    }
  }

  /** Snapshot all rooms to KV. Fire-and-forget; errors are swallowed. */
  persist(): void {
    if (!kvEnabled()) return;
    void kvSetJSON(KV_KEY, this.getAll()).catch(() => {});
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
  // Restore persisted rooms before the singleton is exposed so route handlers
  // (which import this module) see a hydrated registry on the first request.
  if (kvEnabled()) await registry.hydrate();
  globalForRoom.__roomRegistry = registry;
}

export const roomRegistry: RoomRegistry = globalForRoom.__roomRegistry;
