/**
 * TDD: 서버 서명 신원 쿠키
 * sign/verify 라운드트립 + 위조 거부 + 신원 발급.
 */
import { verifyIdentityValue, mintIdentity } from '../lib/relay/session-cookie';

describe('session-cookie 신원 서명', () => {
  it('발급한 신원은 검증을 통과하고 같은 id 를 돌려준다', () => {
    const { id, cookieValue } = mintIdentity();
    expect(verifyIdentityValue(cookieValue)).toBe(id);
  });

  it('서명이 없는 값은 거부한다', () => {
    expect(verifyIdentityValue('plain-id-without-signature')).toBeNull();
    expect(verifyIdentityValue('')).toBeNull();
    expect(verifyIdentityValue(null)).toBeNull();
    expect(verifyIdentityValue(undefined)).toBeNull();
  });

  it('id 를 위조하면(서명 불일치) 거부한다', () => {
    const { cookieValue } = mintIdentity();
    const mac = cookieValue.slice(cookieValue.lastIndexOf('.'));
    // 다른 id + 원래 서명 → 검증 실패해야 한다
    const forged = `attacker-owns-this${mac}`;
    expect(verifyIdentityValue(forged)).toBeNull();
  });

  it('서명을 변조하면 거부한다', () => {
    const { id, cookieValue } = mintIdentity();
    const tampered = `${id}.deadbeef`;
    expect(verifyIdentityValue(tampered)).toBeNull();
  });

  it('매 발급마다 다른 id 를 생성한다', () => {
    const a = mintIdentity();
    const b = mintIdentity();
    expect(a.id).not.toBe(b.id);
  });
});
