# dk-harness-office 배포 & 팀 설정 가이드

## 아키텍처

```
팀원 A: claude (hooks 자동 전송)  ──┐
팀원 B: claude (hooks 자동 전송)  ──┼──→  dk-harness-office (Vercel)  ←── 브라우저 접속
팀원 C: claude (hooks 자동 전송)  ──┘     https://office.team.dev
```

---

## 1. 배포 (관리자)

### 1-1. Vercel 배포

```bash
cd dk-harness-office
npm i -g vercel          # Vercel CLI 설치
vercel link              # 프로젝트 연결
vercel env add RELAY_SECRET   # 팀 공유 시크릿 키 설정
vercel deploy --prod     # 프로덕션 배포
```

배포 URL 예시: `https://dk-harness-office-xxx.vercel.app`

### 1-2. 환경변수

| 변수 | 설명 | 예시 |
|------|------|------|
| `RELAY_SECRET` | API 인증 시크릿 | `sk-office-your-random-secret` |

### 1-3. 커스텀 도메인 (선택)

```bash
vercel domains add office.your-team.dev
```

---

## 2. 팀원 설정 (각 팀원)

### 방법 A: Claude Code Hooks (권장 — 완전 자동)

Claude Code settings에 hooks를 추가하면 **세션 시작 + 도구 사용 시 자동으로** 3D Office에 연결됩니다.

```bash
# 1. dk-harness-office 레포 클론 (hooks 스크립트 필요)
git clone https://github.com/burlesquer/dk-harness-office.git ~/dk-harness-office

# 2. Claude Code settings 편집
claude settings
```

`~/.claude/settings.json`에 추가:

```jsonc
{
  "env": {
    "DK_OFFICE_URL": "https://office.your-team.dev",
    "DK_TEAM_ID": "your-team",
    "DK_AGENT_NAME": "your-name",
    "DK_AGENT_ROLE": "developer",
    "RELAY_SECRET": "sk-office-your-random-secret"
  },
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/dk-harness-office/scripts/hooks/session-connect.mjs"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/dk-harness-office/scripts/hooks/tool-reporter.mjs"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node ~/dk-harness-office/scripts/hooks/tool-done-reporter.mjs"
          }
        ]
      }
    ]
  }
}
```

**이후 `claude` 실행만 하면 자동으로 3D Office에 등장합니다.**

### 방법 B: MCP 플러그인 (수동 도구 사용)

hooks 대신 MCP 도구를 직접 호출하는 방식:

```jsonc
// ~/.claude/settings.json
{
  "mcpServers": {
    "dk-harness-3d-office": {
      "command": "npx",
      "args": ["tsx", "~/dk-harness-office/packages/mcp-plugin/src/server.ts"],
      "env": {
        "OFFICE_RELAY_URL": "https://office.your-team.dev",
        "TEAM_ID": "your-team"
      }
    }
  }
}
```

Claude Code 안에서:
```
> office_register 도구로 세션 등록
> office_status 도구로 현재 상태 확인
> office_event 도구로 이벤트 전송
```

### 방법 C: 팀 Managed Settings (Enterprise — 원클릭)

Claude Code 팀 관리자가 remote-settings.json에 설정하면 **팀원 전원 자동 적용**:

```jsonc
// remote-settings.json (팀 관리자)
{
  "env": {
    "DK_OFFICE_URL": "https://office.your-team.dev",
    "DK_TEAM_ID": "your-team",
    "RELAY_SECRET": "sk-office-your-random-secret"
  },
  "hooks": {
    "SessionStart": [{
      "matcher": "startup",
      "hooks": [{
        "type": "command",
        "command": "npx dk-harness-3d-hooks@latest session-connect"
      }]
    }],
    "PreToolUse": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "npx dk-harness-3d-hooks@latest tool-report"
      }]
    }]
  }
}
```

팀원은 **아무 설정 없이** `claude`만 실행하면 됩니다.

---

## 3. 세션 연결 흐름

```
팀원이 터미널에서 claude 실행
  │
  ├─ [SessionStart hook] ──→ POST /api/relay/register
  │   "iron (developer) 세션 등록됨"
  │   → 3D Office 사이드패널에 이름 표시
  │   → 캐릭터가 자리에 앉음 (idle 상태)
  │
  ├─ 팀원이 Claude에게 질문
  │
  ├─ Claude가 Read 도구 사용
  │   └─ [PreToolUse hook] ──→ POST /api/relay/event
  │       eventType: "tool_start", toolName: "Read"
  │       → 캐릭터가 읽기 애니메이션으로 전환
  │
  ├─ Claude가 Write 도구 사용
  │   └─ [PreToolUse hook] ──→ POST /api/relay/event
  │       eventType: "tool_start", toolName: "Write"
  │       → 캐릭터가 타이핑 애니메이션으로 전환
  │
  ├─ Claude가 Bash 실행
  │   └─ [PreToolUse hook] ──→ POST /api/relay/event
  │       eventType: "tool_start", toolName: "Bash"
  │       → 캐릭터 모니터 활성화
  │
  └─ 세션 종료
      → 30분 후 자동 정리 (SessionRegistry cleanup)
      → 캐릭터 사이드패널에서 제거
```

---

## 4. 3D Office 접속

브라우저에서 배포 URL 접속:

```
https://office.your-team.dev
```

기능:
- **사이드패널**: 현재 활성 팀원 목록 + 상태
- **3D 사무실**: 도트 캐릭터가 자리에서 작업 중
- **캐릭터 클릭**: RC 터미널 패널 (세션 로그)
- **승인 요청**: 위험 명령 시 말풍선 + 모달
- **상태바**: 활성 에이전트 수 + 파이프라인 상태

---

## 5. 환경변수 요약

### 팀원 측 (Claude Code)

| 변수 | 필수 | 설명 |
|------|------|------|
| `DK_OFFICE_URL` | ✅ | Office 서버 URL |
| `DK_TEAM_ID` | ✅ | 팀 식별자 |
| `DK_AGENT_NAME` | ❌ | 표시 이름 (기본: $USER) |
| `DK_AGENT_ROLE` | ❌ | 역할 (기본: developer) |
| `RELAY_SECRET` | ❌ | API 인증 (설정 시 필수) |

### 서버 측 (Vercel)

| 변수 | 필수 | 설명 |
|------|------|------|
| `RELAY_SECRET` | ❌ | API 인증 시크릿 (미설정 시 인증 스킵) |

---

## 6. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| 캐릭터가 안 보임 | WebGL Context Lost | MetaMask 등 확장 비활성화, 시크릿 모드 |
| 세션이 등록 안 됨 | DK_OFFICE_URL 미설정 | settings.json env 확인 |
| 401 Unauthorized | RELAY_SECRET 불일치 | 서버와 클라이언트 시크릿 동기화 |
| hook이 안 됨 | 경로 오류 | `node ~/dk-harness-office/scripts/hooks/session-connect.mjs` 직접 실행 테스트 |
