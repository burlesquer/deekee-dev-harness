import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

/**
 * 서버 서명 신원 쿠키. 로그인 없는 데모에서 "위조 불가능한 안정적 신원"을 부여한다.
 *
 * 쿠키 값 = `<id>.<hmac>` (id 는 랜덤 hex, hmac 은 SECRET 으로 서명).
 * 클라이언트는 id 를 바꿔도 서명을 만들 수 없으므로 ownerId 를 위조할 수 없다.
 * 이 신원으로 룸 소유권(생성/조회/삭제)과 초대 발급 주체를 검증한다.
 */

const COOKIE_NAME = 'dk-identity';
const MAX_AGE_S = 60 * 60 * 24 * 365; // 1 year

// SESSION_SECRET → RELAY_SECRET → (dev 폴백) 순으로 서명 키를 고른다.
function secret(): string {
  return process.env.SESSION_SECRET ?? process.env.RELAY_SECRET ?? 'dk-dev-insecure-secret';
}

function sign(id: string): string {
  const mac = createHmac('sha256', secret()).update(id).digest('hex');
  return `${id}.${mac}`;
}

/** 쿠키 값의 서명을 검증하고 유효하면 id 를, 아니면 null 을 반환한다. */
export function verifyIdentityValue(value: string | undefined | null): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf('.');
  if (dot <= 0) return null;
  const id = value.slice(0, dot);
  const mac = value.slice(dot + 1);
  const expected = createHmac('sha256', secret()).update(id).digest('hex');
  // 타이밍 세이프 비교(길이 다르면 즉시 실패)
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? id : null;
}

/** 요청 쿠키에서 검증된 신원 id 를 읽는다(없거나 위조면 null). */
export function readIdentity(req: NextRequest): string | null {
  return verifyIdentityValue(req.cookies.get(COOKIE_NAME)?.value);
}

/** 새 신원을 발급한다. cookieValue 는 Set-Cookie 로 내려야 한다. */
export function mintIdentity(): { id: string; cookieValue: string } {
  const id = randomBytes(16).toString('hex');
  return { id, cookieValue: sign(id) };
}

/** 응답에 신원 쿠키를 설정한다(httpOnly, 위조 방지). */
export function setIdentityCookie(res: NextResponse, cookieValue: string): void {
  res.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: MAX_AGE_S,
  });
}

/**
 * 요청에서 신원을 읽고, 없으면 새로 발급한다.
 * cookieValue 가 non-null 이면 호출자가 setIdentityCookie 로 응답에 실어야 한다.
 */
export function resolveIdentity(req: NextRequest): { id: string; cookieValue: string | null } {
  const existing = readIdentity(req);
  if (existing) return { id: existing, cookieValue: null };
  const minted = mintIdentity();
  return { id: minted.id, cookieValue: minted.cookieValue };
}
