import { NextRequest, NextResponse } from 'next/server';
import { roomRegistry } from '@/lib/relay/room-registry';
import type { RoomMember } from '@/lib/relay/room-registry';

// POST /api/rooms/join — join a room by code (or by roomId for public rooms)
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      code?: string;
      roomId?: string;
      sessionId?: string;
      userId?: string;
      agentName?: string;
      agentRole?: string;
    };

    if (!body.sessionId || !body.userId || !body.agentName || !body.agentRole) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, userId, agentName, agentRole' },
        { status: 400 },
      );
    }

    if (!body.code && !body.roomId) {
      return NextResponse.json(
        { error: 'Missing required field: code or roomId' },
        { status: 400 },
      );
    }

    const member: RoomMember = {
      sessionId: body.sessionId,
      userId: body.userId,
      agentName: body.agentName,
      agentRole: body.agentRole,
      joinedAt: Date.now(),
    };

    let room = null;

    if (body.code) {
      room = roomRegistry.join(body.code, member);
      if (!room) {
        return NextResponse.json({ error: 'Invalid room code or room is full' }, { status: 404 });
      }
    } else if (body.roomId) {
      const found = roomRegistry.getById(body.roomId);
      if (!found) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }
      if (!found.settings.isPublic) {
        return NextResponse.json(
          { error: 'Room is not public; a code is required to join' },
          { status: 403 },
        );
      }
      room = roomRegistry.joinById(body.roomId, member);
      if (!room) {
        return NextResponse.json({ error: 'Room is full' }, { status: 409 });
      }
    }

    return NextResponse.json({ ok: true, room });
  } catch (err) {
    console.error('[rooms/join POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
