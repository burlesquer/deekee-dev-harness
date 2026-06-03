#!/usr/bin/env node
/**
 * dk-harness-office PostToolUse hook
 * Claude Code가 도구 사용을 완료할 때마다 tool_done 이벤트를 전송합니다.
 * 이 이벤트로 3D Office 캐릭터가 active → idle 상태로 복귀합니다.
 *
 * 설정: settings.json → hooks.PostToolUse
 */

import { readStdin, getConfig, sendEvent, debugLog } from './lib.mjs';

const { serverUrl: RELAY_URL, teamId: TEAM_ID, agentName: AGENT_NAME, relaySecret } = getConfig();

async function report() {
  try {
    const input = JSON.parse(await readStdin());
    const toolName = input.tool_name || 'unknown';
    const sessionId = input.session_id || `session-${process.pid}`;

    await sendEvent(
      RELAY_URL,
      '/api/relay/event',
      {
        teamId: TEAM_ID,
        sessionId,
        userId: process.env.USER || 'unknown',
        agentName: AGENT_NAME,
        eventType: 'tool_done',
        toolName,
        timestamp: Date.now(),
      },
      relaySecret ? { 'x-relay-secret': relaySecret } : {},
    );
  } catch (err) {
    debugLog('event send failed', err);
    // 연결 실패 시 무시
  }
}

report();
