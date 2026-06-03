import type { Metadata } from 'next';
import { GuideShell, GuideHero, GuideSection, Callout } from '@/components/guide/GuideShell';
import { AGENT_CONFIG, AGENT_GROUPS } from '@/lib/colors';

export const metadata: Metadata = {
  title: '전체 매뉴얼 · dk-harness',
  description: 'dk-harness 전체 레퍼런스 — 21명 에이전트, 45개 스킬, 명령 체계, 하드 룰을 카테고리별로 정리한 매뉴얼.',
};

/** id → {name, role, model} 조회 (AGENT_CONFIG 권위 출처). */
const AGENT_BY_ID = new Map(AGENT_CONFIG.map((a) => [a.id, a]));

/* ---- 명령 체계 (세션 관리 라이프사이클) ---- */

interface CmdRow {
  readonly cmd: string;
  readonly desc: string;
}

const SESSION_COMMANDS: readonly CmdRow[] = [
  { cmd: '/dk-harness start', desc: '초기 셋업 위자드 — 스코프·HUD·실행 모드 구성' },
  { cmd: '/dk-harness status', desc: '현재 세션·활성 모드·진행 상태 조회' },
  { cmd: '/dk-harness next', desc: '다음 권장 단계 제안' },
  { cmd: '/dk-harness reset', desc: '세션 상태 초기화' },
  { cmd: '/dk-harness wizard', desc: '비개발자용 대화형 가이드 모드' },
  { cmd: '/dk-harness learn', desc: '세션 학습 — 패턴을 다음 작업에 반영' },
  { cmd: '/dk-harness help', desc: '명령·스킬 도움말' },
];

/* ---- 스킬 카탈로그 (45개, 카테고리별) ---- */

interface Skill {
  readonly name: string;
  readonly desc: string;
}

interface SkillCategory {
  readonly label: string;
  readonly hint: string;
  readonly skills: readonly Skill[];
}

const SKILL_CATALOG: readonly SkillCategory[] = [
  {
    label: '셋업 · 시작',
    hint: '프로젝트와 팀을 세팅한다',
    skills: [
      { name: 'start', desc: '초기 셋업 위자드(스코프·HUD·실행 모드)' },
      { name: 'init', desc: '문맥 수집 → PROJECT/REQUIREMENTS/TECH-STACK.md 생성' },
      { name: 'harness', desc: '도메인 맞춤 에이전트 팀·스킬 설계(메타 스킬)' },
      { name: 'team', desc: '지정 팀 + staged 파이프라인(plan→exec→verify→fix)' },
      { name: 'do', desc: '자연어 의도 분석 → 최적 명령으로 자동 라우팅' },
      { name: 'auto', desc: '풀 파이프라인 자동 실행(네이티브 팀 스폰)' },
      { name: 'cancel', desc: '활성 모드(팀/플랜/TDD/파이프라인) 취소·정리' },
    ],
  },
  {
    label: '계획 · 심의',
    hint: '무엇을 어떻게 만들지 합의한다',
    skills: [
      { name: 'plan-task', desc: 'DKH-DR 6자 합의 계획(원칙→설계→반론→검증→비평)' },
      { name: 'plan-only', desc: '빠른 단독 계획(합의 루프 없음)' },
      { name: 'task', desc: 'Main/Sub 태스크 체크리스트 계층 추적' },
      { name: 'progress-check', desc: '기획 문서 vs 구현 진행도 비교(%·미구현)' },
    ],
  },
  {
    label: '코드 구현',
    hint: '실제 코드를 만든다',
    skills: [
      { name: 'design', desc: 'Willji로 UI 디자인 생성/편집(Stitch MCP)' },
      { name: 'explore', desc: 'Klay로 코드베이스 구조·패턴·의존성 탐색' },
      { name: 'refactor', desc: '영향분석→실행→검증 단계별 안전 리팩토링' },
      { name: 'clean-code', desc: 'Clean Code 원칙 검증 + 자동 리팩토링' },
      { name: 'flutter-animation', desc: 'Flutter 애니메이션 전략·구현' },
      { name: 'flutter-architecture', desc: 'Flutter 레이어드 아키텍처 설계' },
      { name: 'spring-boot', desc: 'Spring Boot + DDD 아키텍처 가이드' },
    ],
  },
  {
    label: '테스트 · 검증',
    hint: '증거로 동작을 증명한다',
    skills: [
      { name: 'tdd', desc: 'Red→Green→Refactor 사이클 자동 전환' },
      { name: 'test', desc: '테스트 실행·커버리지 갭 분석·누락 생성' },
      { name: 'qa-loop', desc: 'test→fix→retest 자동 루프(최대 5회)' },
      { name: 'verify-evidence', desc: 'Sam으로 증거 체인 수집·완료 판정' },
      { name: 'debug', desc: '과학적 디버깅(증상→가설→증거→반증)' },
      { name: 'investigate', desc: '근본원인 분석 4단계 디버깅' },
      { name: 'lsp', desc: 'LSP+AST 죽은 코드 탐지' },
      { name: 'perf', desc: '번들/런타임/메모리/쿼리 성능 분석' },
      { name: 'benchmark', desc: '성능 회귀 감지(베이스라인 대비)' },
    ],
  },
  {
    label: '리뷰 · 품질',
    hint: '여러 시각으로 검수한다',
    skills: [
      { name: 'review-code', desc: '다중 관점 코드 리뷰(보안+품질+성능 병렬)' },
      { name: 'review-pipeline', desc: '4단계 리뷰(CEO/Eng/Design/Outside)' },
      { name: 'design-review', desc: '디자이너 시각 QA(일관성·간격·위계)' },
      { name: 'design-consultation', desc: '제품 이해 → 디자인 시스템 제안' },
      { name: 'office-hours', desc: 'YC 오피스아워식 제품 심문 6문항' },
    ],
  },
  {
    label: '보안 · 안전',
    hint: '위험을 막는다',
    skills: [
      { name: 'cso-audit', desc: 'CSO 14단계 보안 감사(OWASP+STRIDE)' },
      { name: 'careful', desc: '파괴적 명령 경고 + 디렉토리 한정 편집' },
      { name: 'freeze', desc: '편집을 특정 디렉토리로 제한' },
      { name: 'unfreeze', desc: 'freeze 경계 해제' },
    ],
  },
  {
    label: '배포 · 운영',
    hint: '세상에 내보낸다',
    skills: [
      { name: 'ship', desc: '자동 Ship 워크플로(테스트→커밋→PR)' },
      { name: 'land-and-deploy', desc: 'PR 머지 → CI/배포 대기 → 완료' },
      { name: 'rollback', desc: 'Git 체크포인트 기반 안전 롤백' },
    ],
  },
  {
    label: '모니터 · 관전',
    hint: '에이전트가 일하는 걸 본다',
    skills: [
      { name: 'agent-ui', desc: '에이전트 상태 모니터(터미널/3D 오피스)' },
      { name: 'browse', desc: 'MCP Playwright 브라우저 QA(탐색·검증)' },
      { name: 'ai-pipeline', desc: 'AI 자동 개발 파이프라인(모델→코드→API→테스트)' },
    ],
  },
  {
    label: '학습 · 회고',
    hint: '배우고 돌아본다',
    skills: [
      { name: 'teacher', desc: '소크라테스 문답 교육 모드(만들며 배우기)' },
      { name: 'retro', desc: '주간 엔지니어링 회고(커밋·패턴 분석)' },
      { name: 'figma-read', desc: 'Figma 파일 분석 → 기획 문서 추출' },
    ],
  },
];

/* ---- 하드 룰 (CLAUDE.md 출처) ---- */

const HARD_LIMITS: readonly string[] = [
  '증거 없이 완료 주장 금지 — 테스트/빌드/lint 결과를 반드시 첨부',
  'Agent() 호출 시 description 필수 — "{Name}: {task}" 없으면 스폰 금지',
  '팀 사이즈 분석 필수 — Solo/Duo/Squad/Full 중 명시 후 배포',
  'TDD 강제 — 구현 전 테스트 먼저(RED → GREEN → REFACTOR)',
  '완료 보고서 필수 — Team/Agents/Completeness/Evidence/Verdict',
];

const EVIDENCE: readonly string[] = [
  '코드 변경 후: npm test 또는 vitest run',
  '타입 변경 후: tsc --noEmit',
  '빌드 관련: npm run build',
  '예외: 2파일·10줄 이하 사소한 변경(오타·주석)',
];

export default function ManualPage() {
  return (
    <GuideShell active="manual">
      <GuideHero badge="전체 매뉴얼" title={<>모든 <span className="text-dk-harness-orange">에이전트 · 스킬 · 명령</span> 한눈에</>}>
        dk-harness가 제공하는 <strong className="text-office-text">21명의 에이전트</strong>,
        {' '}<strong className="text-office-text">45개의 스킬</strong>, 그리고 작업을 강제하는 하드 룰을
        카테고리별로 정리했습니다. 자연어로 말해도 되지만, 여기서 무엇이 가능한지 한눈에 볼 수 있습니다.
      </GuideHero>

      {/* 01 명령 체계 */}
      <GuideSection id="how" index="01" title="명령을 부르는 3가지 방법">
        <ol className="ml-5 list-decimal space-y-2">
          <li><strong className="text-office-text">자연어</strong> — &ldquo;로그인 기능 만들어줘&rdquo;처럼 말하면 하네스가 알맞은 스킬·에이전트를 자동 편성합니다.</li>
          <li><strong className="text-office-text">스킬 호출</strong> — <code className="font-mono text-dk-harness-orange">/dk-harness &lt;skill&gt;</code> 형태로 아래 카탈로그의 스킬을 직접 부릅니다.</li>
          <li><strong className="text-office-text">세션 커맨드</strong> — start·status·reset 등 세션 라이프사이클을 관리합니다.</li>
        </ol>

        <div className="mt-5 overflow-hidden rounded-xl border border-office-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-office-surface">
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-office-dim">세션 커맨드</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-office-dim">설명</th>
              </tr>
            </thead>
            <tbody>
              {SESSION_COMMANDS.map((row) => (
                <tr key={row.cmd} className="border-t border-office-border">
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[13px] text-dk-harness-orange">{row.cmd}</td>
                  <td className="px-4 py-2.5 text-sm text-office-muted">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GuideSection>

      {/* 02 에이전트 */}
      <GuideSection id="agents" index="02" title="에이전트 21명 (부서별)">
        <p className="mb-6">각 에이전트는 고유한 역할 · 부서 · 모델 티어(opus/sonnet)를 가집니다. 작업 성격에 맞춰 자동 편성됩니다.</p>
        <div className="flex flex-col gap-6">
          {AGENT_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-office-dim">{group.label}</div>
              <div className="overflow-hidden rounded-xl border border-office-border">
                <table className="w-full border-collapse text-left">
                  <tbody>
                    {group.ids.map((id) => {
                      const a = AGENT_BY_ID.get(id);
                      if (!a) return null;
                      return (
                        <tr key={id} className="border-t border-office-border first:border-t-0">
                          <td className="whitespace-nowrap px-4 py-2.5 text-sm font-bold text-office-text">{a.name}</td>
                          <td className="px-4 py-2.5 text-sm text-office-muted">{a.role}</td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right">
                            <span className={[
                              'rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase',
                              a.model === 'opus' ? 'bg-dk-harness-orange/15 text-dk-harness-orange' : 'bg-office-elevated text-office-dim',
                            ].join(' ')}>
                              {a.model}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </GuideSection>

      {/* 03 스킬 카탈로그 */}
      <GuideSection id="skills" index="03" title="스킬 카탈로그 (45개)">
        <p className="mb-6">모든 스킬은 <code className="font-mono text-dk-harness-orange">/dk-harness &lt;이름&gt;</code> 으로 직접 호출하거나, 자연어로 말하면 자동 선택됩니다.</p>
        <div className="flex flex-col gap-7">
          {SKILL_CATALOG.map((cat) => (
            <div key={cat.label}>
              <div className="mb-3 flex items-baseline gap-2.5">
                <h3 className="m-0 text-base font-bold text-office-text">{cat.label}</h3>
                <span className="text-xs text-office-dim">{cat.hint}</span>
                <span className="ml-auto font-mono text-[11px] text-office-faint">{cat.skills.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {cat.skills.map((s) => (
                  <div key={s.name} className="rounded-xl border border-office-border bg-office-surface px-3.5 py-2.5">
                    <code className="font-mono text-[13px] font-bold text-dk-harness-orange">/{s.name}</code>
                    <div className="mt-0.5 text-xs leading-relaxed text-office-muted">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GuideSection>

      {/* 04 하드 룰 */}
      <GuideSection id="rules" index="04" title="하드 룰 & 증거">
        <p className="mb-4">dk-harness는 아래 5가지를 <strong className="text-office-text">강제</strong>합니다. 어기면 작업이 막힙니다.</p>
        <div className="flex flex-col gap-2">
          {HARD_LIMITS.map((rule, i) => (
            <div key={rule} className="flex gap-3 rounded-xl border border-office-border bg-office-surface px-4 py-3">
              <span className="font-mono text-sm font-bold text-dk-harness-orange">{i + 1}</span>
              <span className="text-sm leading-relaxed text-office-muted">{rule}</span>
            </div>
          ))}
        </div>

        <Callout tone="note" title="증거 요구사항">
          <ul className="m-0 ml-4 list-disc space-y-1">
            {EVIDENCE.map((e) => (
              <li key={e} className="font-mono text-[13px]">{e}</li>
            ))}
          </ul>
        </Callout>

        <Callout tone="warn" title="금지 경로">
          <span className="font-mono text-[13px]">.env*</span> 직접 수정 금지 ·
          {' '}<span className="font-mono text-[13px]">lock 파일</span>은 패키지 매니저로만 ·
          {' '}<span className="font-mono text-[13px]">.github/ · CI 설정</span> 변경 전 확인
        </Callout>
      </GuideSection>
    </GuideShell>
  );
}
