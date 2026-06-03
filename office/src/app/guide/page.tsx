import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import {
  GuideShell,
  GuideHero,
  GuideSection,
  Callout,
  CodeBlock,
  GITHUB_URL,
  OFFICE_URL,
} from '@/components/guide/GuideShell';
import { AgentRoster } from '@/components/guide/AgentRoster';

export const metadata: Metadata = {
  title: 'harness 사용법 · dk-harness',
  description: 'Claude Code를 21명의 에이전트 팀으로 바꾸는 dk-harness 사용 매뉴얼 — 설치, 자연어 사용, 명령어, 팀 로스터.',
};

/* ---- 명령어표 데이터 (README 출처) ---- */

interface CommandRow {
  readonly situation: string;
  readonly command: string;
}

const COMMANDS: readonly CommandRow[] = [
  { situation: '간단한 수정', command: '/dk-harness do "설명"' },
  { situation: '새 기능', command: '/dk-harness auto 기능명 "설명"' },
  { situation: '버그 추적', command: '/dk-harness debug "증상" · investigate' },
  { situation: '코드 리뷰', command: '/dk-harness review-pipeline' },
  { situation: '보안 감사', command: '/dk-harness review cso' },
  { situation: '하네스 설계', command: '/dk-harness harness "리서치 팀 만들어"' },
  { situation: 'AI 파이프라인', command: '/dk-harness ai-pipeline "감성 분석 모델"' },
  { situation: '성능 분석', command: '/dk-harness perf runtime' },
  { situation: 'PR + 배포', command: '/dk-harness ship → land-and-deploy' },
  { situation: '학습 모드', command: '/dk-harness teacher "배우고 싶은 기능"' },
  { situation: '비개발자', command: '/dk-harness wizard' },
  { situation: '실수 복구', command: '/dk-harness rollback' },
];

/* ---- 핵심 기능 (README 출처) ---- */

interface Feature {
  readonly title: string;
  readonly desc: string;
}

const FEATURES: readonly Feature[] = [
  { title: '합의형 계획 (DKH-DR)', desc: '다관점 심의 + 투표로 계획 수렴' },
  { title: '증거 체인', desc: '6종 증거 — 증거 없으면 "완료" 없음' },
  { title: '적응형 라우팅', desc: '복잡도(0–15) → haiku / sonnet / opus 자동 선택' },
  { title: '비용 인텔리전스', desc: '예산 + 상한 + 모델 라우터' },
  { title: '자가 치유', desc: '서킷 브레이커 + 재시도 + 복구 + 롤백' },
  { title: '4단계 리뷰', desc: 'CEO / Eng / Design / Outside Voice' },
  { title: 'CSO 보안 감사', desc: 'OWASP + STRIDE 다단계' },
  { title: 'AI Slop 탐지', desc: '안티패턴 + 리트머스 검사' },
  { title: '멀티 AI 합의', desc: 'Claude + Codex + Gemini 3-보이스 투표' },
  { title: '디자인 시스템 엔진', desc: '토큰 생성/비교/반복/진화/갤러리' },
  { title: 'Teacher 모드', desc: '소크라테스식 질문으로 함께 배우기' },
  { title: '3-Tier Notepad', desc: '컴팩션을 견디는 우선순위 메모' },
];

/* ---- 스펙 (README 출처) ---- */

interface SpecRow {
  readonly label: string;
  readonly value: string;
}

const SPECS: readonly SpecRow[] = [
  { label: '버전', value: '2.9.21' },
  { label: '에이전트', value: '21명' },
  { label: '스킬', value: '45개' },
  { label: '혁신 모듈', value: '33' },
  { label: '테스트', value: '1,454 passing' },
  { label: '훅 응답', value: '~5ms' },
  { label: '런타임 의존성', value: '1 (@ast-grep/napi)' },
  { label: '라이선스', value: 'Apache-2.0' },
];

export default function HarnessGuidePage() {
  return (
    <GuideShell active="harness">
      <GuideHero badge="harness 사용법" title={<>Claude Code를 21명의 <span className="text-dk-harness-orange">에이전트 팀</span>으로</>}>
        dk-harness는 Claude Code 위에 얹는 플러그인입니다. 설치하면 한 명의 비서가 아니라,
        CTO·설계자·백엔드·보안·디자이너·검증가로 구성된 <strong className="text-office-text">전문 팀</strong>처럼 일합니다.
        명령어를 외울 필요 없이 자연어로 말하면 됩니다.
      </GuideHero>

      <GuideSection id="install" index="01" title="설치">
        <p className="mb-1">Claude Code에서 두 줄이면 끝납니다.</p>
        <CodeBlock>{`/plugin marketplace add burlesquer/deekee-dev-harness
/plugin install dk-harness`}</CodeBlock>
        <p className="mb-1">업데이트:</p>
        <CodeBlock>{`claude plugin update dk-harness@dk-harness-marketplace`}</CodeBlock>
        <Callout tone="note" title="요구사항">
          Claude Code <strong className="text-office-text">v2.1.69+</strong> · Node.js <strong className="text-office-text">v22+</strong>
        </Callout>
      </GuideSection>

      <GuideSection id="natural-language" index="02" title="자연어로 말하기">
        <p>명령어 구문을 외울 필요가 없습니다. 하고 싶은 일을 평소처럼 말하면, 하네스가 작업을 보고 알맞은 에이전트(설계/구현/보안/리뷰)를 자동 편성합니다.</p>
        <CodeBlock>{`로그인 기능 만들어줘`}</CodeBlock>
        <p>그러면 PM이 요구사항을 정리하고, 아키텍트가 설계하고, 백엔드·보안이 구현·검증하고, 검증가가 증거(테스트·빌드)를 확인한 뒤 결과를 보고합니다.</p>
      </GuideSection>

      <GuideSection id="commands" index="03" title="상황별 명령어">
        <p className="mb-4">자연어로 충분하지만, 의도를 분명히 하고 싶을 땐 단축 명령을 쓸 수 있습니다.</p>
        <div className="overflow-hidden rounded-xl border border-office-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-office-surface">
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-office-dim">상황</th>
                <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-office-dim">명령어</th>
              </tr>
            </thead>
            <tbody>
              {COMMANDS.map((row) => (
                <tr key={row.situation} className="border-t border-office-border">
                  <td className="whitespace-nowrap px-4 py-2.5 text-sm text-office-text">{row.situation}</td>
                  <td className="px-4 py-2.5 font-mono text-[13px] text-dk-harness-orange">{row.command}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GuideSection>

      <GuideSection id="team" index="04" title="에이전트 팀 (21명)">
        <p className="mb-6">각 에이전트는 고유한 역할 · 성격 · 모델 티어를 가집니다. 작업에 맞춰 자동으로 편성됩니다.</p>
        <AgentRoster />
      </GuideSection>

      <GuideSection id="features" index="05" title="핵심 기능">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} title={f.title} desc={f.desc} />
          ))}
        </div>
      </GuideSection>

      <GuideSection id="spec" index="06" title="스펙">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SPECS.map((s) => (
            <div key={s.label} className="rounded-xl border border-office-border bg-office-surface px-4 py-3 text-center">
              <div className="font-mono text-base font-bold text-dk-harness-orange">{s.value}</div>
              <div className="mt-1 text-[11px] text-office-dim">{s.label}</div>
            </div>
          ))}
        </div>
      </GuideSection>

      <GuideSection id="next" index="07" title="다음 단계">
        <p className="mb-4">에이전트가 일하는 모습을 3D 오피스에서 실시간으로 지켜볼 수 있습니다.</p>
        <div className="flex flex-wrap gap-3">
          <a href="/guide/dashboard" className="rounded-lg bg-dk-harness-orange px-4 py-2.5 text-sm font-bold text-white no-underline transition-colors hover:bg-dk-harness-orange-hover">
            3D 대시보드 사용법 &rarr;
          </a>
          <a href={OFFICE_URL} target="_blank" rel="noreferrer" className="rounded-lg border border-office-border px-4 py-2.5 text-sm font-bold text-office-text no-underline transition-colors hover:border-dk-harness-orange">
            라이브 오피스 열기
          </a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="rounded-lg border border-office-border px-4 py-2.5 text-sm font-bold text-office-text no-underline transition-colors hover:border-dk-harness-orange">
            GitHub
          </a>
        </div>
      </GuideSection>
    </GuideShell>
  );
}

/* ---- 기능 카드 ---- */

interface FeatureCardProps {
  readonly title: ReactNode;
  readonly desc: ReactNode;
}

function FeatureCard({ title, desc }: Readonly<FeatureCardProps>) {
  return (
    <div className="rounded-xl border border-office-border bg-office-surface px-4 py-3.5">
      <div className="mb-1 text-sm font-bold text-office-text">{title}</div>
      <div className="text-xs leading-relaxed text-office-muted">{desc}</div>
    </div>
  );
}
