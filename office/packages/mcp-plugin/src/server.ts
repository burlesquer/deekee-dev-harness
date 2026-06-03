import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const RELAY_URL = process.env.OFFICE_RELAY_URL ?? 'http://localhost:3000';
const TEAM_ID = process.env.TEAM_ID ?? 'default';
const USER_ID = process.env.USER ?? 'unknown';

const server = new McpServer({
  name: 'dk-harness-3d',
  version: '0.1.0',
});

// Tool: office_status — 현재 오피스 상태 조회
server.tool(
  'office_status',
  '3D Office 상태 조회',
  {},
  async () => {
    const res = await fetch(`${RELAY_URL}/api/sessions?teamId=${TEAM_ID}`);
    const sessions = await res.json();
    return {
      content: [{ type: 'text', text: JSON.stringify(sessions, null, 2) }],
    };
  },
);

// Tool: office_register — 수동 세션 등록 (자동 등록 전 테스트용)
server.tool(
  'office_register',
  '오피스에 세션 등록',
  {
    agentName: z.string().describe('에이전트 이름'),
    agentRole: z.string().describe('에이전트 역할'),
  },
  async ({ agentName, agentRole }) => {
    const res = await fetch(`${RELAY_URL}/api/relay/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: crypto.randomUUID(),
        userId: USER_ID,
        agentName,
        agentRole,
        status: 'active',
        registeredAt: Date.now(),
        lastEventAt: Date.now(),
      }),
    });
    return {
      content: [{ type: 'text', text: res.ok ? '등록 완료' : '등록 실패' }],
    };
  },
);

// Tool: office_event — 이벤트 전송 (도구 사용 알림)
server.tool(
  'office_event',
  '오피스에 이벤트 전송',
  {
    eventType: z.string().describe('tool_start | tool_done | status_change'),
    toolName: z.string().optional().describe('도구 이름 (optional)'),
  },
  async ({ eventType, toolName }) => {
    const res = await fetch(`${RELAY_URL}/api/relay/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: TEAM_ID,
        sessionId: 'manual',
        userId: USER_ID,
        agentName: 'manual',
        eventType,
        toolName,
        timestamp: Date.now(),
      }),
    });
    return {
      content: [{ type: 'text', text: res.ok ? '전송 완료' : '전송 실패' }],
    };
  },
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
