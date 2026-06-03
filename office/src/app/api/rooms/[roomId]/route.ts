import { NextRequest, NextResponse } from 'next/server';
import { roomRegistry } from '@/lib/relay/room-registry';
import { readIdentity } from '@/lib/relay/session-cookie';

// GET /api/rooms/[roomId] — room detail + members
// Read-only: no auth required
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const room = await roomRegistry.getById(roomId);
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
// Web mutation: 소유권은 "서명된 신원 쿠키"로 강제한다(헤더/쿼리 위조 불가).
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  try {
    const { roomId } = await params;
    const room = await roomRegistry.getById(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // 검증된 신원만 자기 룸을 삭제할 수 있다.
    const id = readIdentity(req);
    if (!id || room.ownerId !== id) {
      return NextResponse.json({ error: 'Forbidden: only the room owner can delete this room' }, { status: 403 });
    }

    await roomRegistry.delete(roomId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[rooms/[roomId] DELETE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
