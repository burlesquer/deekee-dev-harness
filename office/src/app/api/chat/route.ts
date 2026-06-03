import { NextRequest, NextResponse } from 'next/server';
import { eventBroadcaster } from '@/lib/relay/event-broadcaster';
import type { AgentEvent } from '@/types/session';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      agentId?: string;
      agentName?: string;
      text?: string;
      roomId?: string;
    };

    if (!body.agentId || !body.agentName || !body.text) {
      return NextResponse.json(
        { error: 'Missing required fields: agentId, agentName, text' },
        { status: 400 },
      );
    }

    if (body.text.length > 500) {
      return NextResponse.json({ error: 'text exceeds 500 characters' }, { status: 400 });
    }

    const event: AgentEvent = {
      teamId: 'office',
      sessionId: body.agentId,
      userId: body.agentId,
      agentName: body.agentName,
      roomId: body.roomId,
      eventType: 'chat_message',
      timestamp: Date.now(),
      payload: {
        agentId: body.agentId,
        agentName: body.agentName,
        text: body.text,
      },
    };

    eventBroadcaster.broadcast(event);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[chat POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
