#!/usr/bin/env node
/**
 * dk-harness agent-ui
 * 현재 Claude Code 세션을 브라우저에서 3D 오피스로 표시합니다.
 *
 * Usage:
 *   node bin/agent-ui.mjs
 *   npx dk-harness-office
 *   dk-harness agent-ui (dk-harness 연동 시)
 */

import { execFileSync, spawn } from 'child_process';
import crypto from 'crypto';
import readline from 'readline';

const OFFICE_URL = process.env.DK_OFFICE_URL || 'https://office.dk-harness.site';
const TEAM_ID = process.env.DK_TEAM_ID || 'default';
const AGENT_NAME = process.env.DK_AGENT_NAME || process.env.USER || 'unknown';
const AGENT_ROLE = process.env.DK_AGENT_ROLE || 'developer';
const LOCAL_PORT = 3000;

// 전체 에이전트 목록
const ALL_AGENTS = [
  { id: 'sam',    name: 'Sam',    role: 'CTO' },
  { id: 'able',   name: 'Able',   role: '기획' },
  { id: 'klay',   name: 'Klay',   role: '설계' },
  { id: 'jay',    name: 'Jay',    role: 'API' },
  { id: 'jerry',  name: 'Jerry',  role: 'DB' },
  { id: 'milla',  name: 'Milla',  role: '보안' },
  { id: 'willji', name: 'Willji', role: '디자인' },
  { id: 'derek',  name: 'Derek',  role: '화면' },
  { id: 'rowan',  name: 'Rowan',  role: '모션' },
  { id: 'iron',   name: 'Iron',   role: '마법사' },
];

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

async function registerAgent(serverUrl, agent) {
  const sid = `agent-${agent.id}-${crypto.randomBytes(3).toString('hex')}`;
  const res = await fetch(`${serverUrl}/api/relay/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.RELAY_SECRET ? { 'x-relay-secret': process.env.RELAY_SECRET } : {}),
    },
    body: JSON.stringify({
      sessionId: sid,
      userId: agent.id,
      agentName: agent.id,
      agentRole: agent.role,
      teamId: TEAM_ID,
      status: 'active',
      registeredAt: Date.now(),
      lastEventAt: Date.now(),
    }),
  });
  return { ok: res.ok, sid, agent };
}

async function checkServer(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function startLocalServer() {
  console.log('  🚀 로컬 서버 시작 중...');
  const proc = spawn('npm', ['run', 'dev'], {
    cwd: new URL('..', import.meta.url).pathname,
    detached: true,
    stdio: 'ignore',
  });
  proc.unref();

  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await checkServer(`http://localhost:${LOCAL_PORT}`)) {
      console.log('  ✅ 로컬 서버 시작됨');
      return `http://localhost:${LOCAL_PORT}`;
    }
  }
  throw new Error('서버 시작 시간 초과');
}

function openBrowser(url) {
  try {
    execFileSync('open', [url], { stdio: 'ignore' }); // macOS
  } catch {
    try {
      execFileSync('xdg-open', [url], { stdio: 'ignore' }); // Linux
    } catch {
      console.log(`  📎 브라우저에서 열기: ${url}`);
    }
  }
}

async function resolveServer() {
  let serverUrl = OFFICE_URL;
  const isRemote = !serverUrl.includes('localhost');

  if (isRemote) {
    const ok = await checkServer(serverUrl);
    if (ok) {
      console.log(`  ✅ 서버 연결됨: ${serverUrl}`);
    } else {
      console.log('  ⚠️ 원격 서버 응답 없음, 로컬로 전환');
      serverUrl = await startLocalServer();
    }
  } else {
    const ok = await checkServer(serverUrl);
    if (!ok) {
      serverUrl = await startLocalServer();
    } else {
      console.log('  ✅ 로컬 서버 실행 중');
    }
  }
  return serverUrl;
}

// --setup: 몇 명 active 할지 묻고 일괄 등록
async function setupMode() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🏢 dk-harness agents view — Setup');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const serverUrl = await resolveServer();

  console.log('');
  console.log('  에이전트 목록:');
  ALL_AGENTS.forEach((a, i) => {
    console.log(`    ${String(i + 1).padStart(2)}. ${a.name.padEnd(7)} (${a.role})`);
  });
  console.log('');

  const answer = await ask('  몇 명을 active로 등록할까요? (1-10, all) → ');
  let count;
  if (answer.toLowerCase() === 'all' || answer === '') {
    count = ALL_AGENTS.length;
  } else {
    count = Math.max(1, Math.min(10, parseInt(answer, 10) || ALL_AGENTS.length));
  }

  const selected = ALL_AGENTS.slice(0, count);

  console.log('');
  console.log(`  🚀 ${selected.length}명 등록 중...`);

  const results = await Promise.all(selected.map((a) => registerAgent(serverUrl, a)));
  const success = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);

  console.log('');
  success.forEach((r) => {
    console.log(`  ✅ ${r.agent.name.padEnd(7)} (${r.agent.role}) — active`);
  });
  if (failed.length > 0) {
    failed.forEach((r) => {
      console.log(`  ❌ ${r.agent.name.padEnd(7)} — 등록 실패`);
    });
  }

  // 브라우저 오픈
  const openUrl = `${serverUrl}?session=${success[0]?.sid || ''}`;
  openBrowser(openUrl);

  console.log('');
  console.log(`  🏢 Team:  ${TEAM_ID}`);
  console.log(`  🔗 URL:   ${serverUrl}`);
  console.log(`  👥 Active: ${success.length}/${selected.length}명`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

async function main() {
  const args = process.argv.slice(2);

  // --help 모드
  if (args.includes('--help') || args.includes('-h')) {
    console.log('');
    console.log('Usage: dk-harness-office [options]');
    console.log('');
    console.log('3D Office에 현재 Claude Code 세션을 연결합니다.');
    console.log('');
    console.log('Options:');
    console.log('  --setup    전체 에이전트 일괄 등록 모드');
    console.log('  --help     이 도움말 표시');
    console.log('');
    console.log('Environment:');
    console.log('  DK_OFFICE_URL   Office 서버 URL (기본: https://office.dk-harness.site)');
    console.log('  DK_TEAM_ID      팀 ID (기본: default)');
    console.log('  DK_AGENT_NAME   표시 이름 (기본: $USER)');
    console.log('  DK_AGENT_ROLE   역할 (기본: developer)');
    console.log('  RELAY_SECRET       API 인증 시크릿');
    console.log('');
    process.exit(0);
  }

  // --setup 모드
  if (args.includes('--setup')) {
    return setupMode();
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🏢 dk-harness agents view');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const serverUrl = await resolveServer();

  // 2. 세션 ID
  const sessionId = `agent-${AGENT_NAME}-${crypto.randomBytes(3).toString('hex')}`;

  // 3. 세션 등록
  try {
    const res = await fetch(`${serverUrl}/api/relay/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.RELAY_SECRET ? { 'x-relay-secret': process.env.RELAY_SECRET } : {}),
      },
      body: JSON.stringify({
        sessionId,
        userId: process.env.USER || 'unknown',
        agentName: AGENT_NAME,
        agentRole: AGENT_ROLE,
        teamId: TEAM_ID,
        status: 'active',
        registeredAt: Date.now(),
        lastEventAt: Date.now(),
        sharing: { enabled: true, allowRemoteControl: !!process.env.CLAUDE_REMOTE_CONTROL_URL },
      }),
    });
    if (!res.ok) { console.error('  ❌ 세션 등록 실패'); process.exit(1); }
  } catch (err) {
    console.error(`  ❌ 서버 연결 실패: ${err.message}`);
    process.exit(1);
  }

  // 4. 초대 코드 생성
  let inviteCode = '';
  try {
    const res = await fetch(`${serverUrl}/api/sessions/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.RELAY_SECRET ? { 'x-relay-secret': process.env.RELAY_SECRET } : {}),
      },
      body: JSON.stringify({ sessionId }),
    });
    if (res.ok) {
      const data = await res.json();
      inviteCode = data.invite?.code || '';
    }
  } catch { /* ignore */ }

  // 5. 브라우저 오픈
  const openUrl = `${serverUrl}?session=${sessionId}`;
  openBrowser(openUrl);

  // 6. 결과 출력
  console.log('');
  console.log(`  👤 Agent: ${AGENT_NAME} (${AGENT_ROLE})`);
  console.log(`  🏢 Team:  ${TEAM_ID}`);
  console.log(`  🔗 URL:   ${openUrl}`);

  if (inviteCode) {
    console.log('');
    console.log('  ┌─────────────────────────────┐');
    console.log(`  │  📨 초대 코드: ${inviteCode.padEnd(13)}│`);
    console.log('  │  (5분간 유효)                │');
    console.log('  └─────────────────────────────┘');
    console.log('');
    console.log('  팀원에게 코드를 공유하면 세션에 입장할 수 있습니다.');
    console.log(`  또는 링크 공유: ${serverUrl}?code=${inviteCode}`);
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
}

main().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exit(1);
});
