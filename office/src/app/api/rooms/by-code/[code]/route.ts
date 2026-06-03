import { NextRequest, NextResponse } from 'next/server';
import { roomRegistry } from '@/lib/relay/room-registry';

// GET /api/rooms/by-code/[code] — resolve a room code (e.g. "DK-E318") to its room.
// Read-only: no auth required. Used by the landing page "enter by code" flow.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const room = roomRegistry.getByCode(code.toUpperCase());
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    return NextResponse.json(room);
  } catch (err) {
    console.error('[rooms/by-code GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
