/**
 * TDD: ChatRegistry unit tests
 * RED → GREEN → REFACTOR
 */

import { ChatRegistry } from '../lib/relay/chat-registry';

describe('ChatRegistry', () => {
  let registry: ChatRegistry;

  beforeEach(() => {
    registry = new ChatRegistry();
  });

  // --- addMessage ---

  describe('addMessage', () => {
    it('returns a ChatMessage with generated id and timestamp', () => {
      const msg = registry.addMessage({
        roomId: 'room-1',
        sessionId: 'sess-1',
        userId: 'user-1',
        agentName: 'Jay',
        text: 'hello',
      });
      expect(msg.id).toBeDefined();
      expect(msg.id.length).toBeGreaterThan(0);
      expect(msg.timestamp).toBeGreaterThan(0);
      expect(msg.text).toBe('hello');
      expect(msg.roomId).toBe('room-1');
      expect(msg.sessionId).toBe('sess-1');
      expect(msg.userId).toBe('user-1');
      expect(msg.agentName).toBe('Jay');
    });

    it('assigns unique ids to each message', () => {
      const a = registry.addMessage({ sessionId: 's', userId: 'u', agentName: 'A', text: 'a' });
      const b = registry.addMessage({ sessionId: 's', userId: 'u', agentName: 'A', text: 'b' });
      expect(a.id).not.toBe(b.id);
    });

    it('works without roomId (undefined)', () => {
      const msg = registry.addMessage({ sessionId: 's', userId: 'u', agentName: 'A', text: 'hi' });
      expect(msg.roomId).toBeUndefined();
    });
  });

  // --- getMessages ---

  describe('getMessages', () => {
    beforeEach(() => {
      registry.addMessage({ roomId: 'room-a', sessionId: 's1', userId: 'u', agentName: 'A', text: 'msg1' });
      registry.addMessage({ roomId: 'room-b', sessionId: 's2', userId: 'u', agentName: 'A', text: 'msg2' });
      registry.addMessage({ roomId: 'room-a', sessionId: 's3', userId: 'u', agentName: 'A', text: 'msg3' });
    });

    it('returns all messages when no roomId filter', () => {
      const msgs = registry.getMessages();
      expect(msgs.length).toBe(3);
    });

    it('filters by roomId', () => {
      const msgs = registry.getMessages('room-a');
      expect(msgs.length).toBe(2);
      expect(msgs.every((m) => m.roomId === 'room-a')).toBe(true);
    });

    it('respects limit', () => {
      const msgs = registry.getMessages(undefined, 2);
      expect(msgs.length).toBe(2);
    });

    it('returns most recent when limit applied', () => {
      const msgs = registry.getMessages(undefined, 2);
      expect(msgs[msgs.length - 1].text).toBe('msg3');
    });

    it('returns empty array when roomId has no messages', () => {
      const msgs = registry.getMessages('room-z');
      expect(msgs).toEqual([]);
    });
  });

  // --- getRecent ---

  describe('getRecent', () => {
    it('returns messages after the given since timestamp', () => {
      const before = Date.now() - 1000;
      registry.addMessage({ sessionId: 's', userId: 'u', agentName: 'A', text: 'old' });
      const after = Date.now();
      registry.addMessage({ sessionId: 's', userId: 'u', agentName: 'A', text: 'new' });
      const msgs = registry.getRecent(undefined, after);
      expect(msgs.length).toBe(1);
      expect(msgs[0].text).toBe('new');
      void before;
    });

    it('filters by roomId and since', () => {
      const t = Date.now();
      registry.addMessage({ roomId: 'r1', sessionId: 's', userId: 'u', agentName: 'A', text: 'r1-old' });
      const t2 = Date.now();
      registry.addMessage({ roomId: 'r1', sessionId: 's', userId: 'u', agentName: 'A', text: 'r1-new' });
      registry.addMessage({ roomId: 'r2', sessionId: 's', userId: 'u', agentName: 'A', text: 'r2-new' });
      const msgs = registry.getRecent('r1', t2);
      expect(msgs.length).toBe(1);
      expect(msgs[0].text).toBe('r1-new');
      void t;
    });
  });

  // --- FIFO cap at 500 ---

  describe('max capacity', () => {
    it('keeps at most 500 messages (FIFO eviction)', () => {
      for (let i = 0; i < 510; i++) {
        registry.addMessage({ sessionId: 's', userId: 'u', agentName: 'A', text: `msg${i}` });
      }
      const all = registry.getMessages();
      expect(all.length).toBe(500);
      // oldest messages evicted; first retained should be msg10
      expect(all[0].text).toBe('msg10');
    });
  });
});
