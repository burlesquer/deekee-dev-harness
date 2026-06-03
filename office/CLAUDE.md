# dk-harness-office

Claude Code 에이전트 세션을 3D 오피스로 실시간 시각화하는 Next.js 앱.
에이전트들이 오피스 공간 안에서 캐릭터로 등장하며, 작업 상태와 대화를 실시간으로 반영한다.

## 빌드 및 실행

```bash
npm run dev          # 로컬 개발 서버 (Next.js Turbopack)
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 실행
npm run lint         # ESLint 검사
npx tsc --noEmit     # 타입 체크 (별도 스크립트 없음)
```

## 핵심 디렉토리 구조

```
src/
  app/
    api/relay/        # 세션 릴레이 API 라우트 (SSE, POST)
    session/          # 세션 페이지
  components/
    office/           # 3D 오피스 컴포넌트 (React Three Fiber)
    agent-ui/         # 에이전트 UI 오버레이 컴포넌트
  stores/             # Zustand 전역 상태 관리

scripts/
  hooks/              # Claude Code hook 스크립트 (pre/post tool use)

packages/
  mcp-plugin/         # MCP 서버 플러그인 (세션 데이터 수집)

bin/
  agent-ui.mjs        # CLI 엔트리포인트 (npx dk-harness-office)
```

## 기술 스택

| 항목 | 버전 |
|------|------|
| Next.js | 16.2.1 |
| React | 19.2.4 |
| React Three Fiber | ^9.5.0 |
| Three.js | 0.175.0 |
| @react-three/drei | ^10.7.7 |
| Zustand | ^5.0.12 |
| TypeScript | ^5 |
| Tailwind CSS | ^4 |

## 코딩 컨벤션

- **언어**: 주석과 커밋 메시지는 한국어, 코드(변수명, 함수명, 타입)는 영어
- **클라이언트 컴포넌트**: 3D/인터랙티브 컴포넌트 최상단에 `'use client'` 명시
- **API 라우트**: `src/app/api/` 하위에 위치, Next.js App Router 방식 사용
- **상태 관리**: Zustand store는 `src/stores/` 에 집중, 컴포넌트 내 로컬 상태 최소화
- **TypeScript**: `Readonly<Props>` interface 필수, `any` 타입 금지
- **테마 토큰**: 하드코딩된 hex 색상 금지 — Tailwind 설정의 테마 토큰 사용
- **TDD**: 컴포넌트/로직 변경 시 테스트 먼저 작성 (jest + ts-jest)

## 주요 참고 사항

- 3D 씬은 `src/components/office/` 안에서 R3F Canvas 기반으로 구성된다.
- 세션 릴레이는 SSE(Server-Sent Events)를 통해 훅 데이터를 클라이언트에 스트리밍한다.
- MCP 플러그인(`packages/mcp-plugin/`)은 Claude Code 세션에서 이벤트를 수집해 릴레이 API로 전송한다.
- `bin/agent-ui.mjs`는 `npx dk-harness-office` 명령으로 실행되는 CLI 진입점이다.
