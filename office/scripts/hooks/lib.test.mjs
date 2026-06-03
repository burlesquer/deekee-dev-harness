import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAgentName } from './lib.mjs';

test('parseAgentName: dk-harness "{Name}: task" 규칙에서 로스터 이름 추출', () => {
  assert.equal(parseAgentName('Sam: 전체 설계 리뷰'), 'Sam');
  assert.equal(parseAgentName('Jay: API 엔드포인트 구현'), 'Jay');
  assert.equal(parseAgentName('Willji: 랜딩 디자인'), 'Willji');
});

test('parseAgentName: 대소문자 무관, canonical 이름으로 정규화', () => {
  assert.equal(parseAgentName('sam: 작업'), 'Sam');
  assert.equal(parseAgentName('IRON: 작업'), 'Iron');
  assert.equal(parseAgentName('  klay  :  작업'), 'Klay');
});

test('parseAgentName: 로스터에 없는 이름/형식이면 null', () => {
  assert.equal(parseAgentName('burlesquer: 작업'), null);
  assert.equal(parseAgentName('콜론 없는 설명'), null);
  assert.equal(parseAgentName(''), null);
  assert.equal(parseAgentName(undefined), null);
  assert.equal(parseAgentName(null), null);
});

test('parseAgentName: 이름이 다른 단어의 일부면 매칭 안 함', () => {
  // "Samuel" 은 "Sam" 이 아님
  assert.equal(parseAgentName('Samuel: 작업'), null);
});
