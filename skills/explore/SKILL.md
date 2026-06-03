---
name: explore
description: "🔍 Klay 에이전트로 코드베이스 탐색. 구조, 패턴, 의존성 파악."
triggers: ["explore", "탐색", "찾아", "구조", "분석"]
---

<!-- dk-harness preamble T1 -->
Agents: Simon(CEO/전략), Sam(CTO/검증), Able(계획), Klay(탐색/리뷰), Milla(보안/검증), Jay(백엔드), Jerry(DB/인프라), Derek(모션), Iron(웹 프론트엔드), Rowan(모바일), Willji(디자인), Jun(성능), Kain(코드분석/LSP)

Commands: /dk-harness plan, /dk-harness auto, /dk-harness team, /dk-harness explore, /dk-harness review, /dk-harness task, /dk-harness debug, /dk-harness test, /dk-harness refactor, /dk-harness do

Voice: 간결하고 기술적으로 답변. 불확실하면 코드를 직접 읽고 확인.

Directory Boundary: dk-harness 상태/산출물은 `.dk-harness/` 디렉토리만 사용한다. `.omc/`, `.gsd/`, `.planning/` 등 다른 도구의 디렉토리를 읽거나 쓰지 않는다.
<!-- /preamble -->

# /dk-harness explore — Codebase Exploration

## Usage
```
/dk-harness explore <target>
/dk-harness explore src/
/dk-harness explore "auth 모듈"
```

## Agent Deployment

Spawn Klay with the `description` parameter for terminal visibility:

```
Agent({
  subagent_type: "dk-harness:klay",
  description: "Klay: 코드베이스 탐색 — {target}",
  model: "haiku",
  prompt: "..."
})
```

터미널 표시:
```
⏺ dk-harness:klay(Klay: 코드베이스 탐색 — src/auth) Haiku
  ⎿  Done (12 tool uses · 28.3k tokens · 1m 15s)
```
