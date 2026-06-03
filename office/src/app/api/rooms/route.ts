import { NextRequest, NextResponse } from 'next/server';
import { roomRegistry } from '@/lib/relay/room-registry';

// GET /api/rooms — list public rooms and/or rooms the user belongs to
// query: ?public=true  → public rooms only
//        ?userId=xxx   → rooms where userId is a member
// Read-only: no auth required
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sp = await Promise.resolve(searchParams);
    const publicOnly = sp.get('public') === 'true';
    const userId = sp.get('userId');
    const ownerId = sp.get('ownerId');

    let rooms = await roomRegistry.getAll();

    if (ownerId) {
      // 내 룸 관리용: 내가 소유한(생성한) 룸만 반환
      rooms = rooms.filter((r) => r.ownerId === ownerId);
    } else if (publicOnly) {
      rooms = await roomRegistry.getPublicRooms();
    } else if (userId) {
      const publicRooms = await roomRegistry.getPublicRooms();
      const myRooms = await roomRegistry.getByUserId(userId);
      // Merge deduped
      const seen = new Set<string>();
      rooms = [...publicRooms, ...myRooms].filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
    }

    return NextResponse.json({ rooms, count: rooms.length });
  } catch (err) {
    console.error('[rooms GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/rooms — create a new room
// Web mutation: no RELAY_SECRET gate (browser has no login; ingest endpoints keep the gate)
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      ownerId?: string;
      teamId?: string;
      isPublic?: boolean;
      maxMembers?: number;
      allowSpectators?: boolean;
    };

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }
    if (!body.ownerId || typeof body.ownerId !== 'string') {
      return NextResponse.json({ error: 'Missing required field: ownerId' }, { status: 400 });
    }

    if (body.name.length > 128) {
      return NextResponse.json({ error: 'name exceeds 128 characters' }, { status: 400 });
    }

    if (
      body.maxMembers !== undefined &&
      (typeof body.maxMembers !== 'number' || body.maxMembers < 1 || body.maxMembers > 50)
    ) {
      return NextResponse.json({ error: 'maxMembers must be between 1 and 50' }, { status: 400 });
    }

    const room = await roomRegistry.create(
      body.name,
      body.ownerId,
      body.teamId ?? '',
      {
        isPublic: body.isPublic,
        maxMembers: body.maxMembers,
        allowSpectators: body.allowSpectators,
      },
    );

    return NextResponse.json({ ok: true, room }, { status: 201 });
  } catch (err) {
    console.error('[rooms POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
