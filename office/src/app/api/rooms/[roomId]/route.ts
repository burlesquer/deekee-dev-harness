import { NextRequest, NextResponse } from 'next/server';
import { roomRegistry } from '@/lib/relay/room-registry';

// GET /api/rooms/[roomId] — room detail + members
// Read-only: no auth required
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const room = roomRegistry.getById(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json({ room, members: room.members });
  } catch (err) {
    console.error('[rooms/[roomId] GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/rooms/[roomId] — delete room (owner only)
// Web mutation: no RELAY_SECRET gate; ownership is enforced via x-owner-id instead
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const room = roomRegistry.getById(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const ownerId = req.headers.get('x-owner-id') ?? new URL(req.url).searchParams.get('ownerId');
    if (ownerId && room.ownerId !== ownerId) {
      return NextResponse.json({ error: 'Forbidden: only the room owner can delete this room' }, { status: 403 });
    }

    roomRegistry.delete(roomId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[rooms/[roomId] DELETE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
