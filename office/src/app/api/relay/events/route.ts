import { NextRequest } from 'next/server';
import { eventBroadcaster } from '@/lib/relay/event-broadcaster';
import { roomRegistry } from '@/lib/relay/room-registry';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = (await Promise.resolve(searchParams)).get('roomId');

  // Build a session filter when roomId is provided
  let sessionFilter: Set<string> | null = null;
  if (roomId) {
    const room = roomRegistry.getById(roomId);
    if (room) {
      sessionFilter = new Set(room.members.map((m) => m.sessionId));
    } else {
      // Unknown room — return an empty filter so nothing leaks
      sessionFilter = new Set();
    }
  }

  let controller: ReadableStreamDefaultController | null = null;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
      eventBroadcaster.addClient(c, sessionFilter);

      // Send initial heartbeat so the client knows it's connected
      const heartbeat = `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`;
      c.enqueue(new TextEncoder().encode(heartbeat));
    },
    cancel() {
      if (controller) {
        eventBroadcaster.removeClient(controller);
        controller = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
