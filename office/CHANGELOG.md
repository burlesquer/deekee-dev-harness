# Changelog

## [0.5.0] - 2026-03-23

### Added

- **idle 자율 산책 시스템** — idle 에이전트가 정수기, 화이트보드, 칸반보드 등 오피스 POI를 각자 다른 타이밍/속도로 돌아다님
  - 에이전트별 성격 반영 (Sam은 자리 고수, Iron/Rowan은 활발)
  - 4단계 상태 머신: desk → walking-to → visiting → walking-back
  - 시드 기반 난수로 에이전트마다 고유한 경로/타이밍
- **`--setup` 모드** — `node bin/agent-ui.mjs --setup`으로 에이전트 일괄 등록 (1~10명 선택)
- **`--help` 플래그** — CLI 사용법, 옵션, 환경변수 안내
- **`"bin"` 필드** — `package.json`에 등록, `npx dk-harness-office` 실행 가능
- **`.env.example`** — 서버/클라이언트 환경변수 템플릿 (기본값 차이 명시)
- **`CLAUDE.md`** — Claude Code 프로젝트 컨텍스트 자동 로드
- **`scripts/hooks/lib.mjs`** — hook 공통 모듈 (readStdin, getConfig, sendEvent, debugLog)
- **`DK_DEBUG=1`** — hook 에러 상세 로깅 (opt-in, 기본은 silent)

### Fixed

- `readStdin()` 타이머 leak — `clearTimeout` 추가로 리소스 정리
- `sendEvent()` 무한 대기 — `AbortSignal.timeout(5000)` 적용
- DEPLOY.md에 `PostToolUse` hook 설정 누락

### Changed

- README.md — create-next-app 보일러플레이트 → 프로젝트 고유 문서
- `.gitignore` — `.env.example` 예외 처리 (`!.env.example`)
- 3개 hook 파일 — 인라인 중복 코드 제거, `lib.mjs` import로 통합

## [0.1.0] - 초기 릴리즈

- Next.js 16 + React Three Fiber 3D 오피스 뷰어
- 세션 릴레이 API (register, event, SSE)
- Claude Code hooks 연동 (SessionStart, PreToolUse, PostToolUse)
- MCP 플러그인 (office_register, office_event, office_status)
- 10명 에이전트 3D 캐릭터 + 데스크 배치
