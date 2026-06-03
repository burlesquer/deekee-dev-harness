import { NextRequest, NextResponse } from 'next/server';
import { roomRegistry } from '@/lib/relay/room-registry';

// POST /api/rooms/[roomId]/leave — leave a room
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const body = (await req.json()) as { sessionId?: string };

    if (!body.sessionId) {
      return NextResponse.json({ error: 'Missing required field: sessionId' }, { status: 400 });
    }

    const room = roomRegistry.getById(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    roomRegistry.leave(roomId, body.sessionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[rooms/[roomId]/leave POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
