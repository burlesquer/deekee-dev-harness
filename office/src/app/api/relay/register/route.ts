import { NextRequest, NextResponse } from 'next/server';
import { sessionRegistry } from '@/lib/relay/session-registry';
import { eventBroadcaster } from '@/lib/relay/event-broadcaster';
import { roomRegistry } from '@/lib/relay/room-registry';
import { validateRelaySecret } from '@/lib/relay/auth';
import type { RegisteredSession, AgentEvent } from '@/types/session';

export async function POST(req: NextRequest) {
  if (process.env.RELAY_SECRET && !validateRelaySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<RegisteredSession> & { roomCode?: string };

    if (!body.sessionId || !body.userId || !body.agentRole || !body.agentName) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, userId, agentRole, agentName' },
        { status: 400 },
      );
    }

    // Input length validation
    if (body.agentName.length > 128) {
      return NextResponse.json({ error: 'agentName exceeds 128 characters' }, { status: 400 });
    }

    const session: RegisteredSession = {
      sessionId: body.sessionId,
      userId: body.userId,
      agentRole: body.agentRole,
      agentName: body.agentName,
      teamId: body.teamId,
      status: body.status ?? 'active',
      currentTool: body.currentTool,
      sessionTitle: body.sessionTitle,
      remoteControlUrl: body.remoteControlUrl,
      registeredAt: body.registeredAt ?? Date.now(),
      lastEventAt: body.lastEventAt ?? Date.now(),
    };

    // 룸 코드가 오면 해당 룸의 멤버로 합류시킨다. 이게 "PC 세션 ↔ 룸"의 다리:
    // session.roomId 가 채워지면 이후 이벤트가 룸 도장을 받고, SSE/UI 가 룸 단위로 분리한다.
    // 코드가 없거나 룸이 없으면 전역 세션으로 등록(기존 동작 유지).
    if (body.roomCode) {
      const room = await roomRegistry.getByCode(body.roomCode.toUpperCase());
      if (room) {
        // 합류가 성공한 경우에만 roomId 를 바인딩한다(만석이면 joinById 가 null →
        // 도장만 찍히고 실제 멤버가 아닌 불일치를 막는다).
        const joined = await roomRegistry.joinById(room.id, {
          sessionId: session.sessionId,
          userId: session.userId,
          agentName: session.agentName,
          agentRole: session.agentRole,
          joinedAt: Date.now(),
        });
        if (joined) session.roomId = room.id;
      }
    }

    sessionRegistry.register(session);

    const event: AgentEvent = {
      teamId: (body as Record<string, unknown>).teamId as string ?? 'default',
      sessionId: session.sessionId,
      userId: session.userId,
      agentName: session.agentName,
      roomId: session.roomId,
      eventType: 'register',
      timestamp: Date.now(),
      payload: { session },
    };
    eventBroadcaster.broadcast(event);

    return NextResponse.json({ ok: true, session }, { status: 201 });
  } catch (err) {
    console.error('[relay/register POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (process.env.RELAY_SECRET && !validateRelaySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = (await Promise.resolve(searchParams)).get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId query param' }, { status: 400 });
    }

    sessionRegistry.unregister(sessionId);

    const event: AgentEvent = {
      teamId: 'default',
      sessionId,
      userId: 'unknown',
      agentName: 'unknown',
      eventType: 'unregister',
      timestamp: Date.now(),
    };
    eventBroadcaster.broadcast(event);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[relay/register DELETE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
