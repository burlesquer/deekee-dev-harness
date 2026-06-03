import { NextRequest, NextResponse } from 'next/server';
import { approvalRegistry } from '@/lib/relay/approval-registry';
import { eventBroadcaster } from '@/lib/relay/event-broadcaster';
import { validateRelaySecret } from '@/lib/relay/auth';
import type { ApprovalRequest } from '@/types/session';

// GET /api/approvals — list pending (or all with ?all=true)
// Read-only: no auth required
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = (await Promise.resolve(searchParams)).get('all') === 'true';
  const approvals = all ? approvalRegistry.getAll() : approvalRegistry.getPending();
  return NextResponse.json({ approvals });
}

// POST /api/approvals — register a new approval request
export async function POST(req: NextRequest) {
  if (process.env.RELAY_SECRET && !validateRelaySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<
      Omit<ApprovalRequest, 'id' | 'status' | 'createdAt'>
    >;

    if (!body.sessionId || !body.agentName || !body.toolName || !body.command) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, agentName, toolName, command' },
        { status: 400 },
      );
    }

    // Input length validation
    if (body.agentName.length > 128) {
      return NextResponse.json({ error: 'agentName exceeds 128 characters' }, { status: 400 });
    }
    if (body.toolName.length > 256) {
      return NextResponse.json({ error: 'toolName exceeds 256 characters' }, { status: 400 });
    }
    if (body.command.length > 4096) {
      return NextResponse.json({ error: 'command exceeds 4096 characters' }, { status: 400 });
    }
    if (body.description && body.description.length > 2048) {
      return NextResponse.json({ error: 'description exceeds 2048 characters' }, { status: 400 });
    }

    const approval = approvalRegistry.create({
      sessionId: body.sessionId,
      agentName: body.agentName,
      toolName: body.toolName,
      command: body.command,
      description: body.description,
    });

    // Broadcast approval_request event via SSE
    eventBroadcaster.broadcast({
      teamId: 'approvals',
      sessionId: approval.sessionId,
      userId: 'system',
      agentName: approval.agentName,
      eventType: 'approval_request',
      toolName: approval.toolName,
      timestamp: approval.createdAt,
      payload: { approval },
    });

    return NextResponse.json({ ok: true, approval }, { status: 201 });
  } catch (err) {
    console.error('[approvals POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/approvals — decide on an approval
export async function PATCH(req: NextRequest) {
  if (process.env.RELAY_SECRET && !validateRelaySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      approvalId?: string;
      decision?: 'approved' | 'denied';
      reason?: string;
      decidedBy?: string;
    };

    if (!body.approvalId || !body.decision) {
      return NextResponse.json(
        { error: 'Missing required fields: approvalId, decision' },
        { status: 400 },
      );
    }

    if (body.decision !== 'approved' && body.decision !== 'denied') {
      return NextResponse.json(
        { error: 'decision must be "approved" or "denied"' },
        { status: 400 },
      );
    }

    let approval: ApprovalRequest;
    try {
      approval = approvalRegistry.decide(
        body.approvalId,
        body.decision,
        body.reason,
        body.decidedBy ?? 'user',
      );
    } catch {
      return NextResponse.json({ error: 'Approval not found or already decided' }, { status: 404 });
    }

    // Broadcast approval_resolved event via SSE
    eventBroadcaster.broadcast({
      teamId: 'approvals',
      sessionId: approval.sessionId,
      userId: 'system',
      agentName: approval.agentName,
      eventType: 'approval_resolved',
      toolName: approval.toolName,
      timestamp: Date.now(),
      payload: { approval },
    });

    return NextResponse.json({ ok: true, approval });
  } catch (err) {
    console.error('[approvals PATCH]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
