# dk-harness-office

3D agent office viewer — Claude Code 세션을 실시간 3D 오피스로 시각화

Claude Code를 실행하는 팀원들이 3D 사무실 공간에 캐릭터로 등장하며, 도구 사용(Read, Write, Bash 등)에 따라 애니메이션이 실시간으로 반영됩니다.

---

## 아키텍처

```
팀원 A: claude (hooks 자동 전송)  ──┐
팀원 B: claude (hooks 자동 전송)  ──┼──→  dk-harness-office (Vercel)  ←── 브라우저 접속
팀원 C: claude (hooks 자동 전송)  ──┘     https://office.team.dev
```

---

## Quick Start

```bash
# 1. 레포 클론
git clone https://github.com/burlesquer/dk-harness-office.git

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

---

## 환경변수

### 서버 측 (Vercel)

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `RELAY_SECRET` | 선택 | (없음) | API 인증 시크릿. 미설정 시 인증 스킵 |

### 클라이언트 측 (hooks / Claude Code settings)

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `DK_OFFICE_URL` | 필수 | hooks: `http://localhost:3000` / CLI: `https://office.dk-harness.site` | Office 서버 URL |
| `DK_TEAM_ID` | 필수 | — | 팀 식별자 |
| `DK_AGENT_NAME` | 선택 | `$USER` | 3D 오피스에 표시될 이름 |
| `DK_AGENT_ROLE` | 선택 | `developer` | 역할 레이블 |

> `DK_OFFICE_URL` 기본값 주의: hooks 스크립트는 `http://localhost:3000`(로컬), CLI 직접 실행은 `https://office.dk-harness.site`(프로덕션)을 기본값으로 사용합니다. 팀 배포 환경에서는 반드시 명시적으로 지정하세요.

---

## 연결 방법

### 방법 A: Claude Code Hooks (권장 — 완전 자동)

Claude Code가 세션을 시작하거나 도구를 사용할 때 자동으로 3D Office에 이벤트를 전송합니다.

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
    ]
  }
}
```

이후 `claude` 실행만 하면 자동으로 3D Office에 등장합니다.

### 방법 B: MCP 플러그인 (수동 도구 사용)

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

자세한 설정은 [DEPLOY.md](./DEPLOY.md) 참조.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 3D 렌더링 | React Three Fiber |
| 상태 관리 | Zustand |
| 언어 | TypeScript |
| 배포 | Vercel |
