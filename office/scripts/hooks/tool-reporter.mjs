#!/usr/bin/env node
/**
 * dk-harness-office PreToolUse hook
 * Claude Code가 도구를 사용할 때마다 3D Office에 이벤트를 전송합니다.
 *
 * 설정: settings.json → hooks.PreToolUse
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
        eventType: 'tool_start',
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
