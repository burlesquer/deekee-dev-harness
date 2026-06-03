import { NextRequest, NextResponse } from 'next/server';
import { eventBroadcaster } from '@/lib/relay/event-broadcaster';
import { sessionRegistry } from '@/lib/relay/session-registry';
import { validateRelaySecret } from '@/lib/relay/auth';
import type { AgentEvent, RegisteredSession } from '@/types/session';

const VALID_EVENT_TYPES = [
  'register',
  'tool_start',
  'tool_done',
  'status_change',
  'unregister',
  'approval_request',
  'approval_resolved',
  'command',
] as const;

export async function POST(req: NextRequest) {
  if (process.env.RELAY_SECRET && !validateRelaySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<AgentEvent>;

    if (!body.sessionId || !body.eventType || !body.teamId) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, eventType, teamId' },
        { status: 400 },
      );
    }

    if (!VALID_EVENT_TYPES.includes(body.eventType as typeof VALID_EVENT_TYPES[number])) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
    }

    // Input length validation
    if (body.agentName && body.agentName.length > 128) {
      return NextResponse.json({ error: 'agentName exceeds 128 characters' }, { status: 400 });
    }
    if (body.toolName && body.toolName.length > 256) {
      return NextResponse.json({ error: 'toolName exceeds 256 characters' }, { status: 400 });
    }
    if (body.payload !== undefined && JSON.stringify(body.payload).length > 8192) {
      return NextResponse.json({ error: 'payload exceeds 8192 characters' }, { status: 400 });
    }

    // 이벤트에 룸 도장을 찍는다: 훅은 roomId 를 모르므로(코드만 env 로 받음) 서버가
    // sessionId → 등록 세션 → roomId 로 도출한다. 룸에 안 묶인 세션은 undefined(전역).
    const roomId = sessionRegistry.get(body.sessionId)?.roomId;

    const event: AgentEvent = {
      teamId: body.teamId,
      sessionId: body.sessionId,
      userId: body.userId ?? 'unknown',
      agentName: body.agentName ?? 'unknown',
      roomId,
      eventType: body.eventType,
      toolName: body.toolName,
      timestamp: body.timestamp ?? Date.now(),
      payload: body.payload,
    };

    // Keep session lastEventAt fresh and update status/tool if relevant
    if (event.eventType === 'tool_start') {
      sessionRegistry.updateStatus(event.sessionId, 'active', event.toolName);
    } else if (event.eventType === 'tool_done') {
      sessionRegistry.updateStatus(event.sessionId, 'idle', undefined);
    } else if (event.eventType === 'status_change') {
      const newStatus = event.payload?.status as RegisteredSession['status'] | undefined;
      if (newStatus) {
        sessionRegistry.updateStatus(event.sessionId, newStatus);
      }
    }

    eventBroadcaster.broadcast(event);

    return NextResponse.json({ ok: true, clients: eventBroadcaster.clientCount });
  } catch (err) {
    console.error('[relay/event POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
