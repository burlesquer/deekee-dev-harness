/**
 * TDD: RoomRegistry KV 동기화 (크로스 인스턴스 일관성)
 * RED → GREEN → REFACTOR
 *
 * 서버리스에서 여러 함수 인스턴스가 단일 KV 스냅샷(dk:rooms)을 공유한다.
 * 직전까지의 버그: 읽기 메서드가 콜드스타트 때 1회 hydrate 된 in-memory Map 만
 * 보고 KV 로 폴백하지 않아, warm 인스턴스가 "다른 인스턴스가 만든 룸"을 못 봤다.
 * 또한 stale 스냅샷을 통째로 persist 해 남의 룸을 덮어쓰는 데이터 손실도 있었다.
 *
 * 이 테스트는 RoomRegistry 인스턴스 2개를 같은 mock KV 에 물려
 * (= 서버리스 인스턴스 2개) 읽기 read-through 와 쓰기 read-modify-write 를 검증한다.
 */

// 공유 KV 를 흉내내는 in-memory mock. 모든 RoomRegistry 인스턴스가 같은 store 를 본다.
jest.mock('../lib/relay/kv-store', () => {
  const store = new Map<string, string>();
  return {
    __store: store,
    kvEnabled: () => true,
    kvGetJSON: async (key: string) => {
      const raw = store.get(key);
      return raw ? JSON.parse(raw) : null;
    },
    kvSetJSON: async (key: string, value: unknown) => {
      store.set(key, JSON.stringify(value));
    },
  };
});

import { RoomRegistry } from '../lib/relay/room-registry';
import * as kv from '../lib/relay/kv-store';

const kvStore = (kv as unknown as { __store: Map<string, string> }).__store;

describe('RoomRegistry KV 동기화 (크로스 인스턴스)', () => {
  beforeEach(() => kvStore.clear());

  it('다른 인스턴스가 만든 룸을 코드로 찾는다 (read-through)', async () => {
    const a = new RoomRegistry();
    const b = new RoomRegistry();
    const room = await a.create('room-A', 'owner', 'team', { isPublic: true });

    // B 의 메모리엔 이 룸이 없지만 KV read-through 로 찾아야 한다.
    const found = await b.getByCode(room.code);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(room.id);

    a.destroy();
    b.destroy();
  });

  it('다른 인스턴스가 만든 룸을 id 로 찾는다 (read-through)', async () => {
    const a = new RoomRegistry();
    const b = new RoomRegistry();
    const room = await a.create('room-A', 'owner', 'team');

    const found = await b.getById(room.id);
    expect(found?.id).toBe(room.id);

    a.destroy();
    b.destroy();
  });

  it('공개 룸 목록이 다른 인스턴스의 룸을 포함한다', async () => {
    const a = new RoomRegistry();
    const b = new RoomRegistry();
    await a.create('pub-room', 'owner', 'team', { isPublic: true });

    const list = await b.getPublicRooms();
    expect(list.map((r) => r.name)).toContain('pub-room');

    a.destroy();
    b.destroy();
  });

  it('stale 인스턴스의 쓰기가 다른 룸을 덮어쓰지 않는다 (read-modify-write)', async () => {
    // A 가 룸을 만든다.
    const a = new RoomRegistry();
    const roomA = await a.create('room-A', 'owner', 'team', { isPublic: true });

    // B 는 roomA 를 모르는 새 인스턴스 상태에서 자기 룸을 만든다.
    const b = new RoomRegistry();
    const roomB = await b.create('room-B', 'owner', 'team', { isPublic: true });

    // 제3의 인스턴스에서 보면 두 룸 모두 KV 에 살아 있어야 한다.
    const c = new RoomRegistry();
    expect(await c.getById(roomA.id)).not.toBeNull();
    expect(await c.getById(roomB.id)).not.toBeNull();

    a.destroy();
    b.destroy();
    c.destroy();
  });

  it('join 이 다른 인스턴스에서 만든 룸에 코드로 합류한다', async () => {
    const a = new RoomRegistry();
    const room = await a.create('joinable', 'owner', 'team', { isPublic: true });

    const b = new RoomRegistry();
    const joined = await b.join(room.code, {
      sessionId: 's1',
      userId: 'u1',
      agentName: 'Iron',
      agentRole: 'frontend',
      joinedAt: 1,
    });
    expect(joined).not.toBeNull();
    expect(joined?.members).toHaveLength(1);

    // 새 인스턴스(read-through)에서도 멤버 추가가 보여야 한다.
    // (이미 동기화된 A 는 TTL 스로틀로 최대 SYNC_TTL_MS 동안 stale 할 수 있으므로
    //  fresh 인스턴스로 KV 반영을 검증한다.)
    const c = new RoomRegistry();
    const seenByC = await c.getById(room.id);
    expect(seenByC?.members).toHaveLength(1);

    a.destroy();
    b.destroy();
    c.destroy();
  });

  it('delete 가 KV 에서 룸을 제거하고 다른 인스턴스에 반영된다', async () => {
    const a = new RoomRegistry();
    const room = await a.create('to-delete', 'owner', 'team');

    const b = new RoomRegistry();
    expect(await b.delete(room.id)).toBe(true);

    const c = new RoomRegistry();
    expect(await c.getById(room.id)).toBeNull();

    a.destroy();
    b.destroy();
    c.destroy();
  });

  it('create 가 KV(dk:rooms)에 기록된다', async () => {
    const a = new RoomRegistry();
    await a.create('room-A', 'owner', 'team');
    expect(kvStore.has('dk:rooms')).toBe(true);
    a.destroy();
  });
});

describe('RoomRegistry 단일 인스턴스 왕복', () => {
  it('생성→코드조회→id조회→목록 왕복', async () => {
    const r = new RoomRegistry();
    const room = await r.create('solo', 'owner', 'team', { isPublic: true });
    expect((await r.getByCode(room.code))?.id).toBe(room.id);
    expect((await r.getById(room.id))?.name).toBe('solo');
    expect((await r.getPublicRooms()).some((x) => x.id === room.id)).toBe(true);
    r.destroy();
  });
});
