import type { AgentEvent } from '@/types/session';

interface ClientEntry {
  controller: ReadableStreamDefaultController;
  /** When set, only events whose sessionId is in this set are forwarded. */
  sessionFilter: Set<string> | null;
}

class EventBroadcaster {
  private clients: Map<ReadableStreamDefaultController, ClientEntry> = new Map();

  addClient(
    controller: ReadableStreamDefaultController,
    sessionFilter?: Set<string> | null,
  ): void {
    this.clients.set(controller, {
      controller,
      sessionFilter: sessionFilter ?? null,
    });
  }

  removeClient(controller: ReadableStreamDefaultController): void {
    this.clients.delete(controller);
  }

  broadcast(event: AgentEvent): void {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    const encoded = new TextEncoder().encode(data);

    const dead: ReadableStreamDefaultController[] = [];
    for (const entry of this.clients.values()) {
      // Apply per-client session filter when present
      if (entry.sessionFilter !== null && !entry.sessionFilter.has(event.sessionId)) {
        continue;
      }
      try {
        entry.controller.enqueue(encoded);
      } catch {
        // Stream already closed
        dead.push(entry.controller);
      }
    }
    for (const c of dead) {
      this.clients.delete(c);
    }
  }

  get clientCount(): number {
    return this.clients.size;
  }
}

// Singleton
const globalForBroadcaster = globalThis as typeof globalThis & {
  __eventBroadcaster?: EventBroadcaster;
};

if (!globalForBroadcaster.__eventBroadcaster) {
  globalForBroadcaster.__eventBroadcaster = new EventBroadcaster();
}

export const eventBroadcaster: EventBroadcaster = globalForBroadcaster.__eventBroadcaster;
