/**
 * In-memory 슬라이딩 윈도우 rate limiter.
 *
 * 키(신원 id 또는 IP)별로 windowMs 안의 호출 타임스탬프를 보관하고, limit 을 넘으면 거부한다.
 * 서버리스에서는 함수 인스턴스마다 메모리가 분리되므로 best-effort(인스턴스별) 보호다.
 * 견고한 전역 제한이 필요하면 KV 카운터로 승격한다(추후 과제).
 *
 * now 를 인자로 받아 시간 의존을 주입 가능하게 했다(테스트 결정론).
 */

const globalForRateLimit = globalThis as typeof globalThis & {
  __rateLimitBuckets?: Map<string, number[]>;
};

function buckets(): Map<string, number[]> {
  if (!globalForRateLimit.__rateLimitBuckets) {
    globalForRateLimit.__rateLimitBuckets = new Map();
  }
  return globalForRateLimit.__rateLimitBuckets;
}

/**
 * key 가 windowMs 안에서 limit 회 이내면 호출을 기록하고 true, 초과면 false 를 반환한다.
 * @param key 제한 단위(신원 id / IP 등)
 * @param limit 윈도우당 최대 허용 횟수
 * @param windowMs 윈도우 길이(ms)
 * @param now 현재 시각(ms) — 기본 Date.now()
 */
export function allow(key: string, limit: number, windowMs: number, now: number = Date.now()): boolean {
  const store = buckets();
  const prev = store.get(key) ?? [];
  // 윈도우를 벗어난(만료된) 타임스탬프 제거
  const fresh = prev.filter((t) => now - t < windowMs);

  if (fresh.length >= limit) {
    store.set(key, fresh);
    return false;
  }

  fresh.push(now);
  store.set(key, fresh);
  return true;
}

/** 테스트 전용: 모든 버킷 초기화. */
export function __resetRateLimit(): void {
  buckets().clear();
}
