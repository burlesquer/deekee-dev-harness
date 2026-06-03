import { NextRequest, NextResponse } from 'next/server';
import { roomRegistry } from '@/lib/relay/room-registry';
import { readIdentity, resolveIdentity, setIdentityCookie } from '@/lib/relay/session-cookie';

// GET /api/rooms — list public rooms and/or rooms the user belongs to
// query: ?public=true  → public rooms only
//        ?userId=xxx   → rooms where userId is a member
//        ?mine=true    → rooms owned by the signed identity cookie (소유권 검증)
// Read-only: no auth required (mine 은 서명 쿠키로 본인 룸만 노출)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sp = await Promise.resolve(searchParams);
    const publicOnly = sp.get('public') === 'true';
    const userId = sp.get('userId');
    const mine = sp.get('mine') === 'true';

    let rooms = await roomRegistry.getAll();

    if (mine) {
      // 내 룸 관리용: 쿼리 파라미터가 아니라 "서명된 신원 쿠키"로 소유권을 확인한다(위조 불가).
      const id = readIdentity(req);
      rooms = id ? rooms.filter((r) => r.ownerId === id) : [];
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

    if (body.name.length > 128) {
      return NextResponse.json({ error: 'name exceeds 128 characters' }, { status: 400 });
    }

    // 소유자는 클라이언트가 보낸 ownerId 가 아니라 "서명된 신원 쿠키"에서 도출한다.
    // (쿼리/바디 위조로 남의 룸을 만들거나 가로채는 IDOR 를 차단)
    const identity = resolveIdentity(req);

    if (
      body.maxMembers !== undefined &&
      (typeof body.maxMembers !== 'number' || body.maxMembers < 1 || body.maxMembers > 50)
    ) {
      return NextResponse.json({ error: 'maxMembers must be between 1 and 50' }, { status: 400 });
    }

    const room = await roomRegistry.create(
      body.name,
      identity.id,
      body.teamId ?? '',
      {
        isPublic: body.isPublic,
        maxMembers: body.maxMembers,
        allowSpectators: body.allowSpectators,
      },
    );

    const res = NextResponse.json({ ok: true, room }, { status: 201 });
    if (identity.cookieValue) setIdentityCookie(res, identity.cookieValue);
    return res;
  } catch (err) {
    console.error('[rooms POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
