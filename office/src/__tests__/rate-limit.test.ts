/**
 * TDD: 슬라이딩 윈도우 rate limiter
 * RED → GREEN → REFACTOR
 *
 * 서버리스 in-memory 라 인스턴스별(best-effort) 한계가 있지만, 단일 인스턴스에서
 * 폭주(초대/룸 생성 스팸)를 막는 1차 방어선이다. now 를 주입해 시간을 결정론적으로 테스트한다.
 */

import { allow, __resetRateLimit } from '../lib/relay/rate-limit';

describe('rate-limit allow()', () => {
  beforeEach(() => __resetRateLimit());

  it('윈도우 안에서 limit 까지 허용하고 초과분은 거부한다', () => {
    expect(allow('k', 3, 1000, 0)).toBe(true);
    expect(allow('k', 3, 1000, 100)).toBe(true);
    expect(allow('k', 3, 1000, 200)).toBe(true);
    expect(allow('k', 3, 1000, 300)).toBe(false); // 4번째 거부
  });

  it('키가 다르면 독립적으로 카운트한다', () => {
    expect(allow('a', 1, 1000, 0)).toBe(true);
    expect(allow('b', 1, 1000, 0)).toBe(true);
    expect(allow('a', 1, 1000, 0)).toBe(false);
  });

  it('윈도우가 슬라이드하면 오래된 타임스탬프는 만료된다', () => {
    expect(allow('k', 1, 1000, 0)).toBe(true);
    expect(allow('k', 1, 1000, 500)).toBe(false); // t=0 아직 윈도우 안
    expect(allow('k', 1, 1000, 1000)).toBe(true); // t=0 만료(now-t=1000 ≥ window)
  });
});
