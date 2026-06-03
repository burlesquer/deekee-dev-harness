#!/usr/bin/env node
/**
 * dk-harness-office PreToolUse hook
 * Claude Code가 도구를 사용할 때마다 3D Office에 이벤트를 전송합니다.
 *
 * 설정: settings.json → hooks.PreToolUse
 */

import { readStdin, getConfig, sendEvent, debugLog, parseAgentName } from './lib.mjs';

const { serverUrl: RELAY_URL, teamId: TEAM_ID, agentName: AGENT_NAME, relaySecret } = getConfig();

const SECRET_HEADER = relaySecret ? { 'x-relay-secret': relaySecret } : {};

/**
 * dk-harness 팀원 스폰(Agent/Task) 을 감지하면 해당 에이전트를 오피스에 등장시킵니다.
 * description 의 `"{Name}: {task}"` 규칙에서 로스터 이름을 뽑아 register + tool_start 를 보냅니다.
 */
async function reportSpawnedAgent(input, parentSessionId) {
  const agentName = parseAgentName(input.tool_input?.description);
  if (!agentName) return;

  const sessionId = `${parentSessionId}:${agentName.toLowerCase()}`;
  // 1) 캐릭터 등장 (이미 있으면 갱신)
  await sendEvent(
    RELAY_URL,
    '/api/relay/register',
    {
      sessionId,
      userId: process.env.USER || 'unknown',
      agentName,
      agentRole: 'agent',
      teamId: TEAM_ID,
      status: 'active',
      registeredAt: Date.now(),
      lastEventAt: Date.now(),
    },
    SECRET_HEADER,
  );
  // 2) 작업 시작 애니메이션
  await sendEvent(
    RELAY_URL,
    '/api/relay/event',
    {
      teamId: TEAM_ID,
      sessionId,
      userId: process.env.USER || 'unknown',
      agentName,
      eventType: 'tool_start',
      toolName: 'Task',
      timestamp: Date.now(),
    },
    SECRET_HEADER,
  );
}

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
      SECRET_HEADER,
    );

    // dk-harness 팀원 스폰이면 해당 에이전트 캐릭터도 등장시킨다
    if (toolName === 'Agent' || toolName === 'Task') {
      await reportSpawnedAgent(input, sessionId);
    }
  } catch (err) {
    debugLog('event send failed', err);
    // 연결 실패 시 무시
  }
}

report();
