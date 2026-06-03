import type { Metadata } from 'next';
import {
  GuideShell,
  GuideHero,
  GuideSection,
  Callout,
  CodeBlock,
  OFFICE_URL,
} from '@/components/guide/GuideShell';
import { AgentRoster } from '@/components/guide/AgentRoster';

export const metadata: Metadata = {
  title: '3D 대시보드 사용법 · dk-harness',
  description: 'dk-harness 3D 오피스(관전 대시보드) 사용 매뉴얼 — 룸 생성·코드 입장, 관전 모드, 에이전트 자동 등장 원리, 상태 표시.',
};

/* ---- 상태 표시 데이터 (globals.css status 토큰 기준) ---- */

interface StatusItem {
  readonly label: string;
  readonly dotClass: string;
  readonly desc: string;
}

const STATUSES: readonly StatusItem[] = [
  { label: 'active', dotClass: 'bg-status-active', desc: '도구를 실행 중 — 활발히 작업하는 상태' },
  { label: 'idle', dotClass: 'bg-status-idle', desc: '연결됐지만 대기 중 — 다음 지시를 기다림' },
  { label: 'waiting', dotClass: 'bg-status-blocked', desc: '승인·입력 대기 — 사람의 확인이 필요함' },
  { label: 'offline', dotClass: 'bg-status-offline', desc: '세션 종료 — 더 이상 이벤트를 보내지 않음' },
];

export default function DashboardGuidePage() {
  return (
    <GuideShell active="dashboard">
      <GuideHero badge="3D 대시보드 사용법" title={<>에이전트가 일하는 모습을 <span className="text-dk-harness-orange">실시간 관전</span></>}>
        하네스가 <strong className="text-office-text">엔진</strong>이라면, 3D 오피스는 그 <strong className="text-office-text">화면</strong>입니다.
        에이전트가 작업할 때마다 훅이 이벤트를 중계(relay)하고, 브라우저의 3D 오피스에 캐릭터로 등장해 실시간으로 움직입니다.
      </GuideHero>

      <GuideSection id="open" index="01" title="오피스 접속">
        <p className="mb-3">브라우저에서 라이브 오피스를 엽니다. 별도 설치가 필요 없습니다.</p>
        <a href={OFFICE_URL} target="_blank" rel="noreferrer" className="inline-block rounded-lg bg-dk-harness-orange px-4 py-2.5 text-sm font-bold text-white no-underline transition-colors hover:bg-dk-harness-orange-hover">
          office-black-zeta.vercel.app &rarr;
        </a>
        <p className="mt-3">랜딩 화면의 기본 탭은 <strong className="text-office-text">룸 입장</strong>입니다. 여기서 새 룸을 만들거나, 받은 코드로 입장합니다.</p>
      </GuideSection>

      <GuideSection id="create-room" index="02" title="룸 만들기 → 룸 코드 발급">
        <p className="mb-3">‘룸 입장’ 탭에서 <strong className="text-office-text">+ 룸 만들기</strong>를 누르면 룸이 생성되고, <code className="rounded bg-office-surface px-1.5 py-0.5 font-mono text-dk-harness-orange">DK-XXXX</code> 형식의 룸 코드가 발급됩니다.</p>
        <ul className="ml-4 list-disc space-y-1.5">
          <li>이 코드를 팀원에게 공유하면 같은 오피스에 모일 수 있습니다.</li>
          <li>공개 룸으로 만들면 랜딩의 <strong className="text-office-text">공개 룸</strong> 목록에 노출됩니다.</li>
          <li>비공개 룸은 코드를 아는 사람만 입장할 수 있습니다.</li>
        </ul>
      </GuideSection>

      <GuideSection id="join" index="03" title="코드로 입장">
        <p>‘룸 입장’ 탭의 <strong className="text-office-text">룸 코드로 입장</strong>에 받은 코드를 넣고 입장합니다. URL로 바로 들어갈 수도 있습니다.</p>
        <CodeBlock>{`https://office-black-zeta.vercel.app/?room=<룸ID>
https://office-black-zeta.vercel.app/?code=DK-A1B2  (초대 코드 진입)`}</CodeBlock>
      </GuideSection>

      <GuideSection id="spectate" index="04" title="관전 모드">
        <p className="mb-2">데모 세션을 관전하려면 <code className="rounded bg-office-surface px-1.5 py-0.5 font-mono text-dk-harness-orange">?session=demo</code>로 진입합니다.</p>
        <CodeBlock>{`https://office-black-zeta.vercel.app/?session=demo`}</CodeBlock>
        <Callout tone="warn" title="중요 — 브라우저를 먼저 여세요">
          관전은 SSE(Server-Sent Events)로 동작합니다. SSE는 <strong className="text-office-text">연결된 이후에 발생한 이벤트만</strong> 수신합니다.
          따라서 오피스를 <strong className="text-office-text">먼저 열어 둔 뒤</strong> 작업(세션)을 실행해야 캐릭터의 움직임이 빠짐없이 보입니다.
          이미 끝난 작업은 소급해서 재생되지 않습니다.
        </Callout>
      </GuideSection>

      <GuideSection id="auto-appear" index="05" title="에이전트는 어떻게 등장하나요">
        <p className="mb-4">사람이 캐릭터를 배치하지 않습니다. Claude Code 훅이 자동으로 처리합니다.</p>
        <ol className="ml-4 list-decimal space-y-2">
          <li><strong className="text-office-text">세션 시작</strong> — dk-harness 훅이 설정된 Claude Code 세션을 시작합니다.</li>
          <li><strong className="text-office-text">relay 등록</strong> — 훅이 세션·에이전트 정보를 오피스의 relay API로 등록합니다.</li>
          <li><strong className="text-office-text">3D 등장</strong> — 오피스가 등록을 받아 해당 에이전트를 캐릭터로 좌석에 등장시킵니다.</li>
          <li><strong className="text-office-text">실시간 반영</strong> — 이후 도구 사용·상태 변화가 이벤트로 중계되어 캐릭터 애니메이션과 상태 점에 반영됩니다.</li>
        </ol>
      </GuideSection>

      <GuideSection id="relay-secret" index="06" title="relay 인증 (RELAY_SECRET)">
        <p>이벤트 중계(ingest) 경로는 <code className="rounded bg-office-surface px-1.5 py-0.5 font-mono text-dk-harness-orange">RELAY_SECRET</code>으로 보호됩니다. 웹에서의 룸 생성·입장은 그대로 열려 있고, 훅이 보내는 등록·이벤트만 시크릿 인증을 거칩니다.</p>
        <Callout tone="note" title="새 세션부터 적용">
          시크릿 활성화는 <strong className="text-office-text">새로 시작하는 세션</strong>부터 반영됩니다. 이미 떠 있던 세션은 한 번 재시작해야 인증된 채로 이벤트를 보냅니다.
        </Callout>
      </GuideSection>

      <GuideSection id="status" index="07" title="상태 표시 읽기">
        <p className="mb-4">각 캐릭터의 상태 점 색으로 지금 무엇을 하는지 알 수 있습니다.</p>
        <div className="flex flex-col gap-2">
          {STATUSES.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-lg border border-office-border bg-office-surface px-4 py-2.5">
              <span className={['h-2.5 w-2.5 flex-shrink-0 rounded-full', s.dotClass].join(' ')} aria-hidden="true" />
              <span className="w-16 font-mono text-sm font-bold text-office-text">{s.label}</span>
              <span className="text-xs text-office-muted">{s.desc}</span>
            </div>
          ))}
        </div>
      </GuideSection>

      <GuideSection id="roster" index="08" title="오피스에 등장하는 21인">
        <p className="mb-6">아래 21명이 작업에 편성되면 각자의 좌석에 등장합니다. 점 색은 오피스 캐릭터의 고유 화면색과 같습니다.</p>
        <AgentRoster />
      </GuideSection>

      <GuideSection id="next" index="09" title="다음 단계">
        <div className="flex flex-wrap gap-3">
          <a href="/guide" className="rounded-lg bg-dk-harness-orange px-4 py-2.5 text-sm font-bold text-white no-underline transition-colors hover:bg-dk-harness-orange-hover">
            &larr; harness 사용법
          </a>
          <a href={OFFICE_URL} target="_blank" rel="noreferrer" className="rounded-lg border border-office-border px-4 py-2.5 text-sm font-bold text-office-text no-underline transition-colors hover:border-dk-harness-orange">
            라이브 오피스 열기
          </a>
        </div>
      </GuideSection>
    </GuideShell>
  );
}
