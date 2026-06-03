/**
 * TDD: InviteRegistry 단위 테스트
 * RED → GREEN → REFACTOR
 *
 * 메서드가 KV read-through/RMW 로 async 화되었고, 코드는 항상 4-4 포맷으로
 * 정규화된다(join 입력이 8자 고정이라 길이를 맞춘다). 또한 공유 KV mock 으로
 * 인스턴스 2개를 물려 크로스 인스턴스 일관성을 검증한다.
 */

// 공유 KV 를 흉내내는 in-memory mock. 모든 InviteRegistry 인스턴스가 같은 store 를 본다.
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

import { InviteRegistry } from '../lib/relay/invite-registry';
import * as kv from '../lib/relay/kv-store';

const kvStore = (kv as unknown as { __store: Map<string, string> }).__store;

describe('InviteRegistry', () => {
  let registry: InviteRegistry;

  beforeEach(() => {
    kvStore.clear();
    registry = new InviteRegistry();
  });

  afterEach(() => {
    registry.destroy();
  });

  // --- create ---

  describe('create', () => {
    it('returns an InviteCode with the expected shape (4-4 코드)', async () => {
      const invite = await registry.create('sess-1', 'iron', 'team-a');
      expect(invite.code).toMatch(/^IRON-[0-9A-F]{4}$/);
      expect(invite.sessionId).toBe('sess-1');
      expect(invite.createdBy).toBe('iron');
      expect(invite.teamId).toBe('team-a');
      expect(invite.currentUses).toBe(0);
      expect(invite.maxUses).toBe(-1);
      expect(invite.expiresAt).toBeGreaterThan(Date.now());
    });

    it('프리픽스를 4자로 정규화한다 (긴 이름은 잘림)', async () => {
      const invite = await registry.create('sess-1', 'alice', 'team-a');
      // "ALICE" → 앞 4자 "ALIC"
      expect(invite.code).toMatch(/^ALIC-[0-9A-F]{4}$/);
      // createdBy 표시값은 원본 유지
      expect(invite.createdBy).toBe('alice');
    });

    it('짧은 이름은 hex 로 패딩되어 항상 8자(4-4)다', async () => {
      const invite = await registry.create('sess-1', 'jo', 'team-a');
      // "JO" + hex 패딩 → 4자 프리픽스
      expect(invite.code).toMatch(/^[A-Z0-9]{4}-[0-9A-F]{4}$/);
      expect(invite.code.replace('-', '')).toHaveLength(8);
    });

    it('accepts custom expiresInMs', async () => {
      const before = Date.now();
      const invite = await registry.create('sess-1', 'iron', 'team-a', 60_000);
      expect(invite.expiresAt).toBeGreaterThanOrEqual(before + 60_000 - 50);
      expect(invite.expiresAt).toBeLessThanOrEqual(before + 60_000 + 50);
    });

    it('accepts custom maxUses', async () => {
      const invite = await registry.create('sess-1', 'iron', 'team-a', undefined, 3);
      expect(invite.maxUses).toBe(3);
    });
  });

  // --- validate ---

  describe('validate', () => {
    it('returns the invite for a valid code', async () => {
      const invite = await registry.create('sess-1', 'iron', 'team-a');
      const result = await registry.validate(invite.code);
      expect(result).not.toBeNull();
      expect(result?.code).toBe(invite.code);
    });

    it('returns null for an unknown code', async () => {
      expect(await registry.validate('UNKN-0000')).toBeNull();
    });

    it('returns null for an expired code', async () => {
      const invite = await registry.create('sess-1', 'iron', 'team-a', -1); // already expired
      expect(await registry.validate(invite.code)).toBeNull();
    });

    it('returns null when maxUses is exhausted', async () => {
      const invite = await registry.create('sess-1', 'iron', 'team-a', 300_000, 1);
      await registry.use(invite.code); // consume the only use
      expect(await registry.validate(invite.code)).toBeNull();
    });
  });

  // --- use ---

  describe('use', () => {
    it('increments currentUses and returns the invite', async () => {
      const invite = await registry.create('sess-1', 'iron', 'team-a');
      const result = await registry.use(invite.code);
      expect(result).not.toBeNull();
      expect(result?.currentUses).toBe(1);
    });

    it('returns null for an expired code', async () => {
      const invite = await registry.create('sess-1', 'iron', 'team-a', -1);
      expect(await registry.use(invite.code)).toBeNull();
    });

    it('returns null when maxUses already reached', async () => {
      const invite = await registry.create('sess-1', 'iron', 'team-a', 300_000, 1);
      await registry.use(invite.code);
      expect(await registry.use(invite.code)).toBeNull();
    });

    it('allows unlimited uses when maxUses is -1', async () => {
      const invite = await registry.create('sess-1', 'iron', 'team-a');
      for (let i = 1; i <= 5; i++) {
        const result = await registry.use(invite.code);
        expect(result?.currentUses).toBe(i);
      }
    });
  });

  // --- cleanup ---

  describe('cleanup', () => {
    it('removes expired codes', async () => {
      const invite = await registry.create('sess-1', 'iron', 'team-a', -1); // expired
      registry.cleanup();
      expect(await registry.validate(invite.code)).toBeNull();
    });

    it('keeps valid codes', async () => {
      const invite = await registry.create('sess-1', 'iron', 'team-a', 300_000);
      registry.cleanup();
      expect(await registry.validate(invite.code)).not.toBeNull();
    });
  });
});

// --- 크로스 인스턴스 KV 동기화 ---

describe('InviteRegistry KV 동기화 (크로스 인스턴스)', () => {
  beforeEach(() => kvStore.clear());

  it('다른 인스턴스가 발급한 코드를 검증한다 (read-through)', async () => {
    const a = new InviteRegistry();
    const invite = await a.create('sess-1', 'iron', 'team');

    const b = new InviteRegistry();
    const seen = await b.validate(invite.code);
    expect(seen?.code).toBe(invite.code);

    a.destroy();
    b.destroy();
  });

  it('다른 인스턴스가 발급한 코드를 use 로 소비한다 (RMW)', async () => {
    const a = new InviteRegistry();
    const invite = await a.create('sess-1', 'iron', 'team', 300_000, 1);

    const b = new InviteRegistry();
    const used = await b.use(invite.code);
    expect(used?.currentUses).toBe(1);

    // 다른 인스턴스에서 보면 소진되어 무효
    const c = new InviteRegistry();
    expect(await c.validate(invite.code)).toBeNull();

    a.destroy();
    b.destroy();
    c.destroy();
  });

  it('stale 인스턴스의 발급이 다른 코드를 덮어쓰지 않는다 (RMW)', async () => {
    const a = new InviteRegistry();
    const inviteA = await a.create('sess-A', 'iron', 'team', 300_000);

    const b = new InviteRegistry();
    const inviteB = await b.create('sess-B', 'klay', 'team', 300_000);

    const c = new InviteRegistry();
    expect(await c.validate(inviteA.code)).not.toBeNull();
    expect(await c.validate(inviteB.code)).not.toBeNull();

    a.destroy();
    b.destroy();
    c.destroy();
  });
});
