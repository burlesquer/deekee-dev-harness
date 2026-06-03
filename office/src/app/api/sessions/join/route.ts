import { NextRequest, NextResponse } from 'next/server';
import { inviteRegistry } from '@/lib/relay/invite-registry';

// POST /api/sessions/join — 초대 코드로 세션 입장
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { inviteCode?: string };
    const rawCode = body.inviteCode;

    if (!rawCode || typeof rawCode !== 'string') {
      return NextResponse.json(
        { error: '초대 코드가 필요합니다' },
        { status: 400 },
      );
    }

    const normalized = rawCode.toUpperCase().trim();
    const invite = inviteRegistry.use(normalized);

    if (!invite) {
      return NextResponse.json(
        { error: '유효하지 않거나 만료된 코드입니다' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      sessionId: invite.sessionId,
      agentName: invite.createdBy,
      teamId: invite.teamId,
    });
  } catch (err) {
    console.error('[sessions/join POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
