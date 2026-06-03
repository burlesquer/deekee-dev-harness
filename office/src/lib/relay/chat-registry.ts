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

  addMessage(msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const message: ChatMessage = {
      ...msg,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
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
