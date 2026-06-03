# Architecture

dk-harness is a harness engineering agent framework for Claude Code. This document explains the design decisions and module structure.

## Core Idea

15 named agents collaborate through a PDCA cycle (Plan→Do→Check→Act→Review), with complexity-based model routing, evidence-based verification, and self-healing recovery.

```
User Input
  ↓
Intent Router (11 routes, bilingual)
  ↓
Complexity Scorer (0-15 points)
  ↓
Team Preset (Solo/Duo/Squad/Full)
  ↓
Agent Spawning (parallel, model-routed)
  ↓
PDCA Cycle (5 stages, enforced)
  ↓
Evidence Chain (test/build/lint/review)
  ↓
Sam Verdict (ACHIEVED / INCOMPLETE / FAILED)
```

## Module Structure

### Core (scripts/core/)
- **state.mjs** — Atomic JSON I/O (temp+rename pattern). Race-safe for multi-agent writes.
- **config.mjs** — Dot-notation config access with fallback values.
- **logger.mjs** — Structured JSONL logger. Stderr for immediate visibility, .dk-harness/logs/ for persistence.
- **context-budget.mjs** — Token estimation without external API. 0.75 tok/word (EN), 2 tok/char (KR).

### Routing (scripts/routing/)
- **intent-router.mjs** — 11-route natural language routing. Detects: debug, review, explore, perf, refactor, tdd, security, plan, auto, team, design.
- **complexity-scorer.mjs** — 0-15 score from signals (fileCount, lineCount, domainCount, flags).
- **model-router.mjs** — Routes agents to haiku/sonnet/opus based on complexity + cost mode.

### Review (scripts/review/)
- **review-engine.mjs** — 4-tier review pipeline (Eng/CEO/Design/Outside Voice).
- **review-checklist.mjs** — 18-category code review (6 CRITICAL + 12 INFORMATIONAL).
- **pre-landing-reviewer.mjs** — Diff-based checklist execution for ship step 4.
- **ceo-reviewer.mjs** — Product strategy with 6-question framework.
- **eng-reviewer.mjs** — Architecture/quality/tests/security/performance.
- **design-reviewer.mjs** — AI Slop detection + 10-dimension scoring.
- **review-dashboard.mjs** — Readiness dashboard with staleness detection.
- **scope-drift.mjs** — 3-way comparison (intent vs plan vs diff).
- **outside-voice.mjs** — Adversarial subagent review.
- **cso-audit.mjs** — 14-phase OWASP + STRIDE security audit.
- **qa-health-score.mjs** — 8-category weighted health score (A-F).
- **design-scoring.mjs** — AI Slop 10 + Litmus 7 + Hard Rejection 7.
- **benchmark-engine.mjs** — Performance regression detection with budgets.
- **retro-engine.mjs** — 13-step retrospective with session detection.
- **aria-refs.mjs** — ARIA accessibility tree element addressing.
- **browser-evidence.mjs** — MCP Playwright integration with evidence chain.
- **pdca-integration.mjs** — PDCA↔Review↔Ship gating.

### Ship (scripts/ship/)
- **ship-orchestrator.mjs** — 7-step pipeline controller (actual git execution).
- **ship-engine.mjs** — Ship state management.
- **preflight-check.mjs** — 4-check pre-ship validation.
- **test-triage.mjs** — Pre-existing vs branch-new failure classification.
- **version-bump.mjs** — Semantic versioning (major/minor/patch).
- **changelog-gen.mjs** — Conventional commit parsing + CHANGELOG generation.
- **pr-creator.mjs** — gh CLI PR creation with auto-generated body.
- **deploy-detect.mjs** — Platform detection (Fly/Render/Vercel/Netlify).
- **doc-release.mjs** — Post-ship documentation staleness detection.
- **canary-monitor.mjs** — Post-deploy health monitoring loop.

### Evidence (scripts/evidence/)
- **evidence-chain.mjs** — Structured proof collection (test/build/lint/review).
- **llm-judge.mjs** — 7-criteria LLM quality evaluation (0-10).
- **completeness-scorer.mjs** — Goal-backward verification (0-10).
- **goal-checker.mjs** — Derive assertions from original request.

### Pipeline (scripts/pipeline/)
- **autoplan-engine.mjs** — 6-principle auto-decision system.
- **team-orchestrator.mjs** — Team preset selection (Solo/Duo/Squad/Full).
- **adaptive-preamble.mjs** — Per-agent context generation.

### Guardrail (scripts/guardrail/)
- **guardrail-engine.mjs** — 7-rule declarative engine (block/warn/allow).
- **safety-invariants.mjs** — 5 hard limits (steps, files, time, paths, errors).
- **freeze-engine.mjs** — Directory-scoped edit restriction.
- **careful-checklist.mjs** — Dangerous command detection.
- **mutation-guard.mjs** — File modification audit trail.

### Recovery (scripts/recovery/)
- **circuit-breaker.mjs** — CLOSED→OPEN→HALF_OPEN state machine.
- **retry-engine.mjs** — Exponential backoff with jitter.
- **recovery-engine.mjs** — Rollback to git checkpoint.
- **health-check.mjs** — State file integrity validation.

### Telemetry (scripts/telemetry/)
- **telemetry-engine.mjs** — 3-tier (community/anonymous/off) + pending marker recovery.

### QA (scripts/qa/)
- **qa-orchestrator.mjs** — Health score + fix loop (max 5 cycles).
- **regression-detector.mjs** — Baseline comparison.

### Build (scripts/build/)
- **gen-skill-docs.mjs** — Template→SKILL.md generation with 20 placeholders.
- **resolvers/** — Dynamic content generators (review, ship, evidence, qa).
- **check-freshness.mjs** — CI freshness verification.
- **touchfiles.mjs** — Diff-based test selection.

### CLI (scripts/cli/)
- **dk-harness-config.mjs** — Configuration management.
- **dk-harness-diff-scope.mjs** — Change category detection.
- **dk-harness-analytics.mjs** — Usage statistics dashboard.
- **dk-harness-doctor.mjs** — Installation health check.

## Security Model

- **Guardrails**: 7 rules block dangerous operations (rm -rf, force push, DROP TABLE).
- **5 Hard Limits**: maxSteps(50), maxFileChanges(20), maxSessionMinutes(120), forbiddenPaths, maxConsecutiveErrors(5).
- **Freeze**: Directory-scoped edit restriction with trailing slash boundary.
- **Evidence Required**: No completion without test/build/lint proof.
- **Atomic Writes**: All state files use temp+rename to prevent corruption.

## Agent Team

| Role | Agent | Model | Responsibility |
|------|-------|:-----:|---------------|
| CEO | Simon | opus | Product strategy, scope decisions |
| CTO | Sam | opus | Final verdict, evidence verification |
| PM | Able | sonnet | Requirements, task decomposition |
| Architect | Klay | opus | Codebase scanning, architecture |
| Backend | Jay | sonnet | API development, TDD |
| DB | Jerry | sonnet | Schema, migrations |
| Security | Milla | sonnet | OWASP, CSO audit, code review |
| Performance | Jun | sonnet | Profiling, optimization |
| Code Intel | Kain | sonnet | Dead code, LSP, complexity |
| Design | Willji | sonnet | UI/UX, AI slop detection |
| Frontend | Iron | sonnet | React, wizard mode |
| Mobile | Rowan | sonnet | Flutter, cross-platform |
| Motion | Derek | sonnet | Animations, interactions |

## Multi-AI Consensus (`scripts/multi-ai/`)

Three independent AI voices (Claude, Codex, Gemini) vote on non-trivial decisions through a structured consensus protocol.

- **cli-bridge.ts** — `createBridge(provider)` factory returns a uniform `.ask()` / `.review()` / `.challenge()` interface per AI backend. **Active**: used by session-start and user-prompt-submit hooks for Codex tier detection.
- **consensus-engine.ts** — Collects votes, classifies decisions (`MECHANICAL`/`TASTE`/`USER_CHALLENGE`/`SECURITY_WARNING`), applies quorum rules. **[NOT INTEGRATED]**: implemented and tested but not imported by any production code path. Available for future PDCA review-stage integration when complexityScore >= 10.

See `docs/MULTI-AI.md` for the full architecture document.

## MCP Browse QA (`scripts/review/`)

Browser-based QA testing using Playwright MCP, integrated into the evidence chain.

- **browser-evidence.mjs** — Drives headless Playwright via MCP to navigate pages, capture screenshots, and produce structured evidence entries (URL, selector, assertion, screenshot path).
- **aria-refs.mjs** — ARIA accessibility tree element addressing system. Maps semantic roles to stable selectors so browser-evidence assertions survive DOM changes.
- Evidence from browser tests feeds into `evidence-chain.mjs` alongside unit/build/lint results, giving the Sam verdict a full picture of application health.

## PDCA Auto-Scaling

The PDCA engine now auto-scales iteration limits and review depth based on the complexity score (0-15) from `complexity-scorer.mjs`.

| Complexity Range | Profile | Max PDCA Cycles | Review Tier            |
|:----------------:|---------|:---------------:|------------------------|
| 0-4              | Solo    | 2               | Eng only               |
| 5-8              | Duo     | 3               | Eng + Design           |
| 9-12             | Squad   | 5               | Eng + Design + CEO     |
| 13-15            | Full    | 7               | All 4 tiers + CSO      |

`pdca-engine.mjs` accepts `complexityScore` in `startPdca()` and uses it to set cycle bounds and select which reviewers participate. This eliminates over-review of trivial changes and under-review of complex ones.

## Confidence Decay Learning (`scripts/core/project-memory.mjs`)

Project memory entries now carry `confidence` (0-1), `source` (inferred / user-stated), and `lastDecayed` fields.

- **Decay schedule**: Entries decay by 0.1 every 30 days. When confidence drops below 0.3, the entry is flagged for user re-confirmation.
- **User-stated entries never decay**: If the user explicitly set a preference (`source: "user-stated"`), confidence is locked at 1.0.
- **Re-confirmation flow**: Flagged entries surface during the next planning phase. The user can confirm (reset to 1.0), update, or remove them.

This prevents stale assumptions from silently influencing agent behavior over time.

## Security (`scripts/security/prompt-injection-guard.ts`)

A dedicated prompt injection guard provides defense-in-depth against injection attacks:

- **7 regex patterns** detect common injection vectors: role-override attempts (`ignore previous instructions`, `disregard system prompt`, `you are now a different`, `SYSTEM: override`, `forget everything`, `new instructions:`, `do not follow previous`).
- **base64-encoded payload detection**: Detect long base64 strings (80+ chars) that may hide injection commands.
- **Unicode homoglyph attack detection**: Detect Cyrillic/Greek characters mixed with Latin text to bypass keyword filters.
- **HTML/Markdown injection detection**: Detect `<script>`, `<iframe>`, `<object>` tags that could alter agent rendering context.
- **XML trust boundary wrapping**: All external content (tool output, user-provided files, API responses) is wrapped in `<untrusted>` XML tags before being included in agent context. Agents are instructed to treat content within these tags as data, never as instructions.
- **Fail-closed**: If the guard detects a pattern, the request is blocked and logged. No fallback execution occurs.

## Cost Dashboard (session-end hook)

The agent cost dashboard provides automatic cost tracking and summary at session end:

- **session-end hook** aggregates token usage across all agents spawned during the session.
- Per-agent breakdown: model, input tokens, output tokens, estimated cost (USD).
- Session total with comparison to the 7-day rolling average.
- Cost data is persisted in `.dk-harness/telemetry/` for trend analysis via `dk-harness-analytics.mjs`.
- Alerts when a session exceeds 2x the rolling average, helping catch runaway agent loops early.
