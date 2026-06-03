import { NextRequest, NextResponse } from 'next/server';
import { sessionRegistry } from '@/lib/relay/session-registry';
import { eventBroadcaster } from '@/lib/relay/event-broadcaster';
import { validateRelaySecret } from '@/lib/relay/auth';
import type { RegisteredSession, AgentEvent } from '@/types/session';

export async function POST(req: NextRequest) {
  if (process.env.RELAY_SECRET && !validateRelaySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<RegisteredSession>;

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

    sessionRegistry.register(session);

    const event: AgentEvent = {
      teamId: (body as Record<string, unknown>).teamId as string ?? 'default',
      sessionId: session.sessionId,
      userId: session.userId,
      agentName: session.agentName,
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
