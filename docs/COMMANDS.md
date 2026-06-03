# dk-harness Commands Reference

## Workflow

| Command | What it does |
|---------|-------------|
| `/dk-harness start <name>` | Start PDCA cycle (Plan stage) |
| `/dk-harness auto <feat> <task>` | Full pipeline: Klay - Able - Jay/Derek - Milla - Sam |
| `/dk-harness status` | Real-time dashboard (PDCA + TDD + Tasks + Budget) |
| `/dk-harness next` | Advance to next PDCA stage |
| `/dk-harness wizard` | Iron -- guided magic for non-developers |

## TDD

| Command | What it does |
|---------|-------------|
| `/dk-harness tdd start <feat> <target>` | Begin RED phase -- write failing test first |
| `/dk-harness tdd check pass` | Record pass -- advance phase (RED-GREEN-REFACTOR) |
| `/dk-harness tdd check fail` | Record fail -- stay in current phase with guidance |
| `/dk-harness tdd status` | Show current TDD phase |

## Task Checklist

| Command | What it does |
|---------|-------------|
| `/dk-harness task create <title>` | Create Main Task with Sub Tasks |
| `/dk-harness task check <id> <seq>` | Mark subtask done |
| `/dk-harness task list` | List all tasks with progress |

## Agent Direct

| Command | Agent | Role |
|---------|-------|------|
| `/dk-harness explore <target>` | Klay | Architecture + codebase scan |
| `/dk-harness plan <task>` | Able + Klay | Requirements + architecture |
| `/dk-harness execute <task>` | Jay + Derek | Backend + Frontend |
| `/dk-harness review` | Milla | Security + quality review |
| `/dk-harness verify` | Sam | Final review + evidence chain |

## Review Pipeline

| Command | What it does |
|---------|-------------|
| `/dk-harness review-pipeline` | Auto-select review depth by complexity |
| `/dk-harness review-pipeline eng` | Eng Review: Klay + Jay + Milla |
| `/dk-harness review-pipeline ceo` | CEO Review: Able + Sam |
| `/dk-harness review-pipeline design` | Design Review: Willji + Iron |
| `/dk-harness review-pipeline full` | All 4 tiers + outside voice |

**Complexity-based auto-selection:**

| Complexity | Tiers |
|:----------:|-------|
| low (0-3) | Eng only (Milla) |
| mid (4-7) | Eng + Design |
| high (8+) | CEO + Eng + Design + Outside Voice |

## Ship Workflow

| Step | Action |
|:----:|--------|
| 1 | Pre-flight: review dashboard CLEARED + evidence PASS |
| 2 | Base branch merge (auto conflict detection) |
| 3 | Test execution + failure triage |
| 4 | Pre-landing review (SQL injection, LLM boundary, scope drift) |
| 5 | Version bump (auto major/minor/patch) |
| 6 | CHANGELOG generation (conventional commits) |
| 7 | Push + PR creation (auto-generated body) |

## Security

| Command | What it does |
|---------|-------------|
| `/dk-harness review cso` | 14-phase security audit (OWASP + STRIDE + secrets + supply chain) |

## Recovery & Safety

| Command | What it does |
|---------|-------------|
| `/dk-harness rollback` | Revert to last git checkpoint |
| `/dk-harness freeze <dir>` | Restrict edits to directory |
| `/dk-harness unfreeze` | Clear freeze restriction |
| `/dk-harness careful` | Safety mode for production work |

## Design

| Command | What it does |
|---------|-------------|
| `/dk-harness design-consultation` | Full design system proposal |
| `/dk-harness design-review` | Visual QA audit (AI slop + litmus + hard rejections) |

## Other

| Command | What it does |
|---------|-------------|
| `/dk-harness retro [7d|14d|30d]` | Engineering retrospective |
| `/dk-harness benchmark` | Performance regression detection |
| `/dk-harness investigate` | Systematic debugging (4-phase) |
| `/dk-harness office-hours` | YC-style product review |
| `/dk-harness perf runtime` | Performance analysis |
| `/dk-harness refactor src/` | Code refactoring |
| `/dk-harness lsp` | Dead code / static analysis |
| `/dk-harness land-and-deploy` | Full CD pipeline (merge → deploy → canary) |
| `/dk-harness learn show` | View cross-session learning |
| `/dk-harness help` | Show agent team and commands |

## Quick Reference

| 상황 | 명령어 |
|:-----|:------|
| 간단한 수정 | `/dk-harness do "설명"` |
| 새 기능 | `/dk-harness auto 기능명 "설명"` |
| 버그 | `/dk-harness debug "증상"` |
| 코드 리뷰 | `/dk-harness review-pipeline` |
| PR + 배포 | `/dk-harness ship` |
| 테스트 | `/dk-harness tdd start 기능 "설명"` |
| 코드 이해 | `/dk-harness explore src/` |
| 보안 감사 | `/dk-harness review cso` |
| 실수 복구 | `/dk-harness rollback` |
