/**
 * dk-harness-office hook 공통 유틸리티
 * session-connect, tool-reporter, tool-done-reporter 에서 공유합니다.
 */

/**
 * stdin 에서 JSON 문자열을 읽습니다.
 * DK_STDIN_TIMEOUT ms (기본 1000) 안에 응답이 없으면 '{}'을 반환합니다.
 * @returns {Promise<string>}
 */
export function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    const timeout = parseInt(process.env.DK_STDIN_TIMEOUT, 10) || 1000;
    const timer = setTimeout(() => {
      process.stdin.destroy();
      resolve(data || '{}');
    }, timeout);
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(data || '{}');
    });
  });
}

/**
 * 환경변수에서 서버 설정을 읽어 반환합니다.
 * @returns {{ serverUrl: string, teamId: string, agentName: string, agentRole: string, relaySecret: string | undefined }}
 */
export function getConfig() {
  return {
    serverUrl: process.env.DK_OFFICE_URL || 'http://localhost:3000',
    teamId: process.env.DK_TEAM_ID || 'default',
    agentName: process.env.DK_AGENT_NAME || process.env.USER || 'unknown',
    agentRole: process.env.DK_AGENT_ROLE || 'developer',
    relaySecret: process.env.RELAY_SECRET || undefined,
  };
}

/**
 * fetch wrapper — 5초 타임아웃을 자동으로 적용합니다.
 * @param {string} serverUrl - 베이스 URL (예: 'http://localhost:3000')
 * @param {string} path - 경로 (예: '/api/relay/event')
 * @param {object} body - JSON 직렬화할 요청 바디
 * @param {Record<string, string>} [extraHeaders] - 추가 헤더
 * @returns {Promise<Response>}
 */
export function sendEvent(serverUrl, path, body, extraHeaders = {}) {
  return fetch(`${serverUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });
}

/**
 * DK_DEBUG 환경변수가 설정된 경우에만 stderr 에 로그를 출력합니다.
 * @param {string} msg - 로그 메시지
 * @param {Error} [err] - 스택 트레이스를 포함할 에러 객체 (선택)
 */
export function debugLog(msg, err) {
  if (!process.env.DK_DEBUG) return;
  console.error(`[dk-harness-3d] ${msg}`);
  if (err?.stack) console.error(`[dk-harness-3d] ${err.stack}`);
}
