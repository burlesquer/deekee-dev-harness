/**
 * TDD: InviteRegistry unit tests
 * RED → GREEN → REFACTOR
 */

// We test the class directly, not the singleton, so we can reset state between tests
import { InviteRegistry } from '../lib/relay/invite-registry';

describe('InviteRegistry', () => {
  let registry: InviteRegistry;

  beforeEach(() => {
    registry = new InviteRegistry();
  });

  afterEach(() => {
    registry.destroy();
  });

  // --- create ---

  describe('create', () => {
    it('returns an InviteCode with the expected shape', () => {
      const invite = registry.create('sess-1', 'iron', 'team-a');
      expect(invite.code).toMatch(/^IRON-[0-9A-F]{4}$/);
      expect(invite.sessionId).toBe('sess-1');
      expect(invite.createdBy).toBe('iron');
      expect(invite.teamId).toBe('team-a');
      expect(invite.currentUses).toBe(0);
      expect(invite.maxUses).toBe(-1);
      expect(invite.expiresAt).toBeGreaterThan(Date.now());
    });

    it('uppercases createdBy in the code prefix', () => {
      const invite = registry.create('sess-1', 'alice', 'team-a');
      expect(invite.code).toMatch(/^ALICE-[0-9A-F]{4}$/);
    });

    it('accepts custom expiresInMs', () => {
      const before = Date.now();
      const invite = registry.create('sess-1', 'iron', 'team-a', 60_000);
      expect(invite.expiresAt).toBeGreaterThanOrEqual(before + 60_000 - 50);
      expect(invite.expiresAt).toBeLessThanOrEqual(before + 60_000 + 50);
    });

    it('accepts custom maxUses', () => {
      const invite = registry.create('sess-1', 'iron', 'team-a', undefined, 3);
      expect(invite.maxUses).toBe(3);
    });
  });

  // --- validate ---

  describe('validate', () => {
    it('returns the invite for a valid code', () => {
      const invite = registry.create('sess-1', 'iron', 'team-a');
      const result = registry.validate(invite.code);
      expect(result).not.toBeNull();
      expect(result?.code).toBe(invite.code);
    });

    it('returns null for an unknown code', () => {
      expect(registry.validate('UNKNOWN-0000')).toBeNull();
    });

    it('returns null for an expired code', () => {
      const invite = registry.create('sess-1', 'iron', 'team-a', -1); // already expired
      expect(registry.validate(invite.code)).toBeNull();
    });

    it('returns null when maxUses is exhausted', () => {
      const invite = registry.create('sess-1', 'iron', 'team-a', 300_000, 1);
      registry.use(invite.code); // consume the only use
      expect(registry.validate(invite.code)).toBeNull();
    });
  });

  // --- use ---

  describe('use', () => {
    it('increments currentUses and returns the invite', () => {
      const invite = registry.create('sess-1', 'iron', 'team-a');
      const result = registry.use(invite.code);
      expect(result).not.toBeNull();
      expect(result?.currentUses).toBe(1);
    });

    it('returns null for an expired code', () => {
      const invite = registry.create('sess-1', 'iron', 'team-a', -1);
      expect(registry.use(invite.code)).toBeNull();
    });

    it('returns null when maxUses already reached', () => {
      const invite = registry.create('sess-1', 'iron', 'team-a', 300_000, 1);
      registry.use(invite.code);
      expect(registry.use(invite.code)).toBeNull();
    });

    it('allows unlimited uses when maxUses is -1', () => {
      const invite = registry.create('sess-1', 'iron', 'team-a');
      for (let i = 1; i <= 5; i++) {
        const result = registry.use(invite.code);
        expect(result?.currentUses).toBe(i);
      }
    });
  });

  // --- cleanup ---

  describe('cleanup', () => {
    it('removes expired codes', () => {
      const invite = registry.create('sess-1', 'iron', 'team-a', -1); // expired
      registry.cleanup();
      expect(registry.validate(invite.code)).toBeNull();
    });

    it('keeps valid codes', () => {
      const invite = registry.create('sess-1', 'iron', 'team-a', 300_000);
      registry.cleanup();
      expect(registry.validate(invite.code)).not.toBeNull();
    });
  });
});
