/**
 * 이 브라우저의 안정적 소유자 ID 를 반환한다(localStorage 에 1회 생성·보관).
 * 로그인이 없는 데모 환경에서 룸 ownerId / 내 룸 식별자로 사용한다.
 *
 * 키: 'dk-office-client-id' → 값: UUID 문자열.
 * localStorage 접근 불가(SSR/프라이빗) 시 휘발성 anon ID 로 폴백한다.
 */
const CLIENT_ID_KEY = 'dk-office-client-id';

export function getClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
    return id;
  } catch {
    return `anon-${crypto.randomUUID()}`;
  }
}
