import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { inviteRegistry } from '@/lib/relay/invite-registry';

// 발급 만료 허용 범위(클램프).
const MIN_EXPIRES_MS = 60 * 1000; // 1 minute
const MAX_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEFAULT_EXPIRES_MS = 60 * 60 * 1000; // 1 hour

function generateSessionId(): string {
  return `sess-${randomBytes(12).toString('hex')}`;
}

// POST /api/sessions/invite — 초대 코드 발급
// 랜딩에서 팀원 초대용 코드를 발급한다. 새 sessionId 를 예약하고 그 세션에 대한
// 초대 코드를 만든다(에이전트가 이후 그 세션으로 접속하면 오피스에 등장).
// Web mutation: no RELAY_SECRET gate (브라우저엔 로그인이 없음).
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      agentName?: string;
      expiresInMs?: number;
      maxUses?: number;
    };

    const agentName = body.agentName?.trim();
    if (!agentName) {
      return NextResponse.json({ error: 'Missing required field: agentName' }, { status: 400 });
    }
    if (agentName.length > 128) {
      return NextResponse.json({ error: 'agentName exceeds 128 characters' }, { status: 400 });
    }

    // 만료 클램프
    let expiresInMs = typeof body.expiresInMs === 'number' ? body.expiresInMs : DEFAULT_EXPIRES_MS;
    expiresInMs = Math.min(MAX_EXPIRES_MS, Math.max(MIN_EXPIRES_MS, expiresInMs));

    // maxUses: 양의 정수 또는 무제한(-1)
    let maxUses = -1;
    if (body.maxUses !== undefined) {
      if (typeof body.maxUses !== 'number' || (body.maxUses !== -1 && body.maxUses < 1)) {
        return NextResponse.json({ error: 'maxUses must be -1 or a positive integer' }, { status: 400 });
      }
      maxUses = Math.floor(body.maxUses);
    }

    const sessionId = generateSessionId();
    const invite = await inviteRegistry.create(sessionId, agentName, '', expiresInMs, maxUses);

    return NextResponse.json(
      {
        ok: true,
        code: invite.code,
        sessionId: invite.sessionId,
        createdBy: invite.createdBy,
        expiresAt: invite.expiresAt,
        maxUses: invite.maxUses,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error('[sessions/invite POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
