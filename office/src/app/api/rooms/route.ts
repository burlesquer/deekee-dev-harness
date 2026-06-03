import { NextRequest, NextResponse } from 'next/server';
import { roomRegistry } from '@/lib/relay/room-registry';
import { validateRelaySecret } from '@/lib/relay/auth';

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

    let rooms = roomRegistry.getAll();

    if (publicOnly) {
      rooms = roomRegistry.getPublicRooms();
    } else if (userId) {
      const publicRooms = roomRegistry.getPublicRooms();
      const myRooms = roomRegistry.getByUserId(userId);
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
export async function POST(req: NextRequest) {
  if (process.env.RELAY_SECRET && !validateRelaySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    const room = roomRegistry.create(
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
