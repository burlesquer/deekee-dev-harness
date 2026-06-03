import crypto from 'crypto';

export interface ChatMessage {
  id: string;
  roomId?: string;
  sessionId: string;
  userId: string;
  agentName: string;
  text: string;
  timestamp: number;
}

const MAX_MESSAGES = 500;

export class ChatRegistry {
  private messages: ChatMessage[] = [];
  // 마지막으로 발급한 타임스탬프. 같은 ms 안에 여러 메시지가 들어와도
  // 순서(= recency 커서)가 무너지지 않도록 단조 증가를 보장한다.
  private lastTimestamp = 0;

  addMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    // 단조 증가 타임스탬프: 벽시계가 멈춰 보여도(같은 ms) 직전 값 +1 로 전진시킨다.
    // getRecent(since) 가 메시지 경계 타임스탬프를 커서로 쓸 때 결정론적이 된다.
    const timestamp = Math.max(Date.now(), this.lastTimestamp + 1);
    this.lastTimestamp = timestamp;
    const message: ChatMessage = {
      ...msg,
      id: crypto.randomUUID(),
      timestamp,
    };
    this.messages.push(message);
    // FIFO eviction: keep at most MAX_MESSAGES
    if (this.messages.length > MAX_MESSAGES) {
      this.messages = this.messages.slice(this.messages.length - MAX_MESSAGES);
    }
    return message;
  }

  getMessages(roomId?: string, limit?: number): ChatMessage[] {
    let result = roomId !== undefined
      ? this.messages.filter((m) => m.roomId === roomId)
      : [...this.messages];
    if (limit !== undefined && limit > 0) {
      result = result.slice(-limit);
    }
    return result;
  }

  getRecent(roomId?: string, since?: number): ChatMessage[] {
    let result = roomId !== undefined
      ? this.messages.filter((m) => m.roomId === roomId)
      : [...this.messages];
    if (since !== undefined) {
      result = result.filter((m) => m.timestamp >= since);
    }
    return result;
  }
}

// Singleton
const globalForChat = globalThis as typeof globalThis & {
  __chatRegistry?: ChatRegistry;
};

if (!globalForChat.__chatRegistry) {
  globalForChat.__chatRegistry = new ChatRegistry();
}

export const chatRegistry: ChatRegistry = globalForChat.__chatRegistry;
