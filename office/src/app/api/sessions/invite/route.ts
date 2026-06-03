import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { inviteRegistry } from '@/lib/relay/invite-registry';
import { resolveIdentity, readIdentity, setIdentityCookie } from '@/lib/relay/session-cookie';
import { allow } from '@/lib/relay/rate-limit';
import { AGENT_CONFIG } from '@/lib/colors';

// 발급 폭주 방지: 신원(쿠키) 또는 IP 당 분당 10회.
const INVITE_RATE_LIMIT = 10;
const INVITE_RATE_WINDOW_MS = 60 * 1000;

function rateLimitKey(req: NextRequest): string {
  const id = readIdentity(req);
  if (id) return `invite:id:${id}`;
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  return `invite:ip:${ip}`;
}

// 발급 가능한 에이전트 이름 화이트리스트(자유 텍스트 발급 차단).
const ALLOWED_AGENTS = new Set<string>(AGENT_CONFIG.map((a) => a.name));

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
    if (!allow(rateLimitKey(req), INVITE_RATE_LIMIT, INVITE_RATE_WINDOW_MS)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = (await req.json()) as {
      agentName?: string;
      expiresInMs?: number;
      maxUses?: number;
    };

    const agentName = body.agentName?.trim();
    if (!agentName) {
      return NextResponse.json({ error: 'Missing required field: agentName' }, { status: 400 });
    }
    // 알려진 에이전트만 발급 주체로 허용(임의 신원 토큰 발급 방지).
    if (!ALLOWED_AGENTS.has(agentName)) {
      return NextResponse.json({ error: 'agentName must be a known agent' }, { status: 400 });
    }

    // 발급은 검증된 신원에 묶는다(없으면 신원을 발급해 쿠키로 내린다).
    const identity = resolveIdentity(req);

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

    const res = NextResponse.json(
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
    if (identity.cookieValue) setIdentityCookie(res, identity.cookieValue);
    return res;
  } catch (err) {
    console.error('[sessions/invite POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
