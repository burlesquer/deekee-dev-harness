---
name: agent-ui
description: "에이전트 활동 모니터. 세션 내 에이전트 상태를 터미널 또는 3D 오피스에서 확인."
triggers: ["agent-ui", "3d office", "오피스", "시각화", "agent view", "에이전트 상태"]
---

# /dk-harness agent-ui — Agent Activity Monitor

에이전트 활동을 모니터링합니다. 기본 모드는 **설치 없이 즉시 동작**합니다.

## MANDATORY: 인자 파싱 후 즉시 실행

사용자 인자를 확인합니다:

- 인자 없음 → **기본 모드** (3D 오피스 브라우저 오픈)
- `--monitor` → **모니터 모드** (터미널 내 에이전트 활동 요약)
- `--status` → **Status 모드** (전체 진단)
- `--setup` → **3D Setup 모드** (3D 오피스 자동 설정)

---

### 기본 모드 (인자 없음) — 브라우저에서 3D 오피스 열기

**반드시 아래 Bash 커맨드를 실행하세요. 분석하거나 질문하지 마세요.**

현재 세션 ID + 활성 에이전트 정보를 URL 파라미터로 전달하여 3D 오피스와 자동 연결합니다.

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/scripts/agent-ui/open-office.js"
```

---

### 모니터 모드 (`--monitor`) — 터미널 내 에이전트 활동

**반드시 아래 Bash 커맨드를 실행하세요.**

```bash
node --input-type=module -e "
import { formatTraceSummary } from '${CLAUDE_PLUGIN_ROOT}/dist/scripts/trace/agent-trace.js';
const projectDir = process.env.PROJECT_DIR || process.cwd();

console.log('━━━ dk-harness Agent Monitor ━━━');
console.log('');
console.log('Available Agents:');
console.log('  Sam(CTO) Able(PM) Klay(Architect) Jay(Backend) Jerry(DB) Milla(Security) Willji(Design) Derek(Motion) Rowan(Mobile) Iron(Web Frontend)');
console.log('');
const trace = formatTraceSummary(projectDir);
console.log(trace);
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('Commands:');
console.log('  /dk-harness agent-ui            브라우저 3D 오피스');
console.log('  /dk-harness agent-ui --monitor  이 화면');
console.log('  /dk-harness agent-ui --status   전체 진단');
console.log('  /dk-harness auto <task>         에이전트 팀 실행');
"
```

---

### Status 모드 (`--status`)

내장 기능 + 3D 오피스 연결 상태를 진단합니다.

```bash
echo "━━━ dk-harness agent-ui Status ━━━"
echo ""
echo "[ 내장 기능 (설치 불필요) ]"
echo "  HUD Status Line: $(grep -q 'statusline.mjs\|dk-harness-hud' ~/.claude/settings.json 2>/dev/null && echo '✅ 활성' || echo '⚠️ 비활성 — /dk-harness start로 설정')"
echo "  Agent Trace: $(test -f .dk-harness/state/agent-traces.json && echo '✅ 기록 중' || echo '⚠️ 아직 기록 없음')"
echo "  Hook Matcher: $(grep -q 'Agent|Task' "${CLAUDE_PLUGIN_ROOT}/hooks/hooks.json" 2>/dev/null && echo '✅ Agent/Task 감지' || echo '❌ Agent/Task 미감지')"
echo ""
echo "[ 3D 오피스 (선택사항) ]"
echo "  DK_OFFICE_URL: ${DK_OFFICE_URL:-미설정}"
echo "  DK_TEAM_ID: ${DK_TEAM_ID:-미설정}"
echo "  DK_AGENT_NAME: ${DK_AGENT_NAME:-$USER}"
OFFICE_DIR="$HOME/dk-harness-office"
if [ ! -d "$OFFICE_DIR" ]; then
  OFFICE_DIR="$(find $HOME/Project -maxdepth 2 -name 'dk-harness-office' 2>/dev/null | head -1)"
fi
if [ -d "$OFFICE_DIR" ]; then
  echo "  dk-harness-office: ✅ $OFFICE_DIR"
else
  echo "  dk-harness-office: 미설치 (3D 오피스에만 필요)"
fi
if grep -q "session-connect.mjs" ~/.claude/settings.json 2>/dev/null; then
  echo "  3D Hooks: ✅ 설치됨"
else
  echo "  3D Hooks: 미설치 (/dk-harness agent-ui --setup으로 설정)"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

---

### Setup 모드 (`--setup`)

3D 오피스 세션 연결을 **원커맨드로 자동 설정**합니다. 경로 탐색, 환경변수, hook 등록을 모두 자동 처리.

**반드시 아래 Bash 커맨드를 실행하세요.**

```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/scripts/setup/agent-ui-setup.js"
```

커스텀 옵션이 필요한 경우:
```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/scripts/setup/agent-ui-setup.js" --office-url https://custom.url --team-id myteam --agent-name myname
```

해제:
```bash
node "${CLAUDE_PLUGIN_ROOT}/dist/scripts/setup/agent-ui-setup.js" --uninstall
```

**자동으로 수행하는 작업:**
1. `~/dk-harness-office` 또는 `~/Project/**/dk-harness-office` 자동 탐색
2. `~/.claude/settings.json`에 환경변수 3개 설정 (DK_OFFICE_URL, DK_TEAM_ID, DK_AGENT_NAME)
3. SessionStart/PreToolUse/PostToolUse hook 자동 등록 (session-connect, tool-reporter, tool-done-reporter)
4. 이미 등록된 hook은 중복 추가하지 않음
5. 로컬 미설치 시 클라우드 모드(`https://office.dk-harness.site`)로 자동 폴백

---

## 트러블슈팅

| 문제 | 해결 |
|------|------|
| "기록된 트레이스가 없습니다" | 에이전트를 spawn한 적이 없으면 정상. `/dk-harness auto` 등으로 에이전트 실행 후 다시 확인. |
| Status Line에 에이전트가 안 보임 | `/dk-harness start`로 HUD 활성화 필요. 또는 `--status`로 진단. |
| 3D 오피스 연결 안 됨 | `--setup`으로 재설정하거나 `--status`로 진단. 클라우드 모드로 대체 가능. |
| Hook Matcher에 Agent/Task 미감지 | dk-harness 플러그인을 최신 버전으로 업데이트하세요. |

## 관련 프로젝트

- **dk-harness-office**: https://github.com/burlesquer/dk-harness-office
- **배포 URL**: https://office.dk-harness.site
