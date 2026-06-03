#!/usr/bin/env node
/**
 * dk-harness-office SessionStart hook
 * Claude Code 세션이 시작되면 자동으로 3D Office에 등록합니다.
 *
 * 단계:
 *   1. 세션 ID 추출 & 서버 연결 확인
 *   2. 세션 등록 (Remote Control 자동 감지)
 *   3. 세션 URL + 상태 정보 출력
 *
 * 설정: settings.json → hooks.SessionStart
 */

import { readStdin, getConfig, sendEvent, debugLog } from './lib.mjs';

const config = getConfig();
const { serverUrl: RELAY_URL, teamId: TEAM_ID, agentName: AGENT_NAME, agentRole: AGENT_ROLE, relaySecret, roomCode: ROOM_CODE } = config;

async function register() {
  try {
    const input = JSON.parse(await readStdin());
    const sessionId = input.session_id || `session-${Date.now()}`;

    // Step 1: 서버 연결 확인
    const serverOk = await checkServer(RELAY_URL);
    if (!serverOk) {
      console.error('[dk-harness-3d] ⚠ Office 서버 연결 불가 — 오프라인 모드');
      return;
    }

    // Step 2: Remote Control 감지
    const remoteControlUrl = process.env.CLAUDE_REMOTE_CONTROL_URL || undefined;
    const rcEnabled = !!remoteControlUrl;

    // Step 3: 세션 등록
    const body = {
      sessionId,
      userId: process.env.USER || 'unknown',
      agentName: AGENT_NAME,
      agentRole: AGENT_ROLE,
      teamId: TEAM_ID,
      status: 'active',
      registeredAt: Date.now(),
      lastEventAt: Date.now(),
      // 룸 코드가 있으면 서버가 이 세션을 룸 멤버로 합류시킨다(룸 ↔ PC 세션 바인딩).
      ...(ROOM_CODE ? { roomCode: ROOM_CODE } : {}),
      sharing: {
        enabled: true,
        allowRemoteControl: rcEnabled,
        remoteControlUrl: remoteControlUrl || null,
      },
    };

    const res = await sendEvent(
      RELAY_URL,
      '/api/relay/register',
      body,
      relaySecret ? { 'x-relay-secret': relaySecret } : {},
    );

    if (!res.ok) {
      console.error('[dk-harness-3d] ❌ 세션 등록 실패');
      return;
    }

    // Step 4: 상태 정보 출력
    // 서버가 roomCode 를 해석해 session.roomId 를 채웠으면 룸 화면(?room=)으로, 아니면 세션 화면으로.
    let roomId;
    try {
      const data = await res.json();
      roomId = data?.session?.roomId;
    } catch {
      // 응답 파싱 실패 시 세션 URL 로 폴백
    }
    const sessionUrl = roomId
      ? `${RELAY_URL}?room=${roomId}`
      : `${RELAY_URL}?session=${sessionId}`;

    console.error('');
    console.error('[dk-harness-3d] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`[dk-harness-3d]  🏢 3D Office 연결됨`);
    console.error('[dk-harness-3d] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`[dk-harness-3d]  👤 Agent: ${AGENT_NAME} (${AGENT_ROLE})`);
    console.error(`[dk-harness-3d]  🏷  Team:  ${TEAM_ID}`);
    if (roomId) {
      console.error(`[dk-harness-3d]  🚪 Room:  ${ROOM_CODE} (이 룸에서 세션이 돕니다)`);
    } else if (ROOM_CODE) {
      console.error(`[dk-harness-3d]  🚪 Room:  ${ROOM_CODE} ⚠ 룸을 못 찾음 — 전역 세션으로 등록`);
    }
    console.error(`[dk-harness-3d]  🔗 URL:   ${sessionUrl}`);

    if (rcEnabled) {
      console.error(`[dk-harness-3d]  🎮 RC:    활성화됨`);
    } else {
      console.error(`[dk-harness-3d]  🎮 RC:    비활성화 (--remote-control 플래그로 활성화)`);
    }

    console.error('[dk-harness-3d] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');

  } catch (err) {
    debugLog('session register failed', err);
    // 연결 실패 시 무시 (Office가 실행 안 중일 수 있음)
  }
}

async function checkServer(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

register();
