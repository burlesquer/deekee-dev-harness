'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InviteCodeInput } from './InviteCodeInput';
import { InviteCodeIssuer } from './InviteCodeIssuer';
import { RoomSection } from './RoomSection';
import { AGENT_CONFIG, AGENT_GROUPS, AGENT_SCREEN_COLORS } from '@/lib/colors';

/** id → 표시 이름 조회 맵 (그룹 렌더 시 이름 해석용). */
const AGENT_NAME_BY_ID = new Map<string, string>(AGENT_CONFIG.map((a) => [a.id, a.name]));

export interface LandingPageProps {
  readonly initialCode?: string | null;
}

type ActiveTab = 'invite' | 'room';

const GITHUB_URL = 'https://github.com/burlesquer/deekee-dev-harness';

/** 히어로 아래 노출할 핵심 가치 4종 (README 출처). */
const HIGHLIGHTS: readonly { readonly title: string; readonly desc: string }[] = [
  { title: '역할 기반 팀', desc: '작업을 보고 알맞은 에이전트를 자동 편성' },
  { title: '합의형 계획', desc: '다관점 심의 + 투표로 계획 수렴' },
  { title: '증거 강제', desc: '테스트·빌드 없이는 "완료" 없음' },
  { title: '실시간 3D 관전', desc: '팀이 일하는 모습을 화면으로' },
];

export function LandingPage({ initialCode }: Readonly<LandingPageProps>) {
  // 룸 입장이 즉시 사용 가능한 기본 흐름이라 기본 탭으로 둔다.
  // (초대 코드는 ?code/?session 으로 진입한 경우에만 기본 노출)
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialCode ? 'invite' : 'room');

  return (
    // body 전역 overflow:hidden 이라 랜딩은 자체 스크롤 컨테이너로 감싼다.
    <div className="h-screen overflow-y-auto bg-office-bg font-sans text-office-text">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-14">
        {/* === Hero === */}
        <header className="text-center">
          <div className="mb-5 inline-block rounded-full bg-dk-harness-orange px-4 py-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-white">
              dk-harness v2.9.21
            </span>
          </div>

          <h1 className="mb-3 text-4xl font-extrabold tracking-tight text-office-text sm:text-5xl">
            dk-harness <span className="text-dk-harness-orange">Agent</span> Office
          </h1>

          <p className="mx-auto mb-7 max-w-md text-sm leading-relaxed text-office-muted sm:text-base">
            Claude Code를 21명의 에이전트 팀으로. 팀이 일하는 모습을 이 3D 오피스에서 실시간으로 관전하세요.
          </p>

          {/* CTA — 매뉴얼 2종 + GitHub */}
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/guide"
              className="rounded-lg bg-dk-harness-orange px-4 py-2.5 text-sm font-bold text-white no-underline transition-colors duration-150 hover:bg-dk-harness-orange-hover"
            >
              harness 사용법
            </Link>
            <Link
              href="/guide/dashboard"
              className="rounded-lg border border-office-border px-4 py-2.5 text-sm font-bold text-office-text no-underline transition-colors duration-150 hover:border-dk-harness-orange"
            >
              3D 대시보드 사용법
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-office-border px-4 py-2.5 text-sm font-bold text-office-text no-underline transition-colors duration-150 hover:border-dk-harness-orange"
            >
              GitHub
            </a>
          </div>
        </header>

        {/* === Highlights === */}
        <div className="mb-11 mt-9 grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="rounded-xl border border-office-border bg-office-surface px-3 py-3 text-center">
              <div className="text-xs font-bold text-office-text">{h.title}</div>
              <div className="mt-1 text-[11px] leading-snug text-office-dim">{h.desc}</div>
            </div>
          ))}
        </div>

        {/* === Agent Avatars (21명, 부서별 구분) === */}
        <div className="mb-10 flex w-full flex-col gap-6">
          {AGENT_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="mb-2.5 text-center text-[11px] uppercase tracking-[0.15em] text-office-dim">
                {group.label}
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {group.ids.map((id) => (
                  <AgentAvatar key={id} id={id} name={AGENT_NAME_BY_ID.get(id) ?? id} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* === Entry card (룸/초대) === */}
        <main className="w-full overflow-hidden rounded-2xl border border-office-border bg-office-surface shadow-lg shadow-dk-harness-orange/5">
          {/* Tab bar */}
          <div className="flex border-b border-office-border" role="tablist" aria-label="입장 방식 선택">
            <TabButton
              label="초대 코드"
              active={activeTab === 'invite'}
              onClick={() => setActiveTab('invite')}
              id="tab-invite"
              panelId="panel-invite"
            />
            <TabButton
              label="룸 입장"
              active={activeTab === 'room'}
              onClick={() => setActiveTab('room')}
              id="tab-room"
              panelId="panel-room"
            />
          </div>

          {/* Tab panels */}
          <div className="px-8 pb-9 pt-7">
            <div id="panel-invite" role="tabpanel" aria-labelledby="tab-invite" hidden={activeTab !== 'invite'}>
              {activeTab === 'invite' && (
                <div className="flex flex-col items-center gap-5">
                  <p className="m-0 text-xs tracking-wider text-office-muted">
                    팀원에게 받은 초대 코드를 입력하세요
                  </p>
                  <InviteCodeInput initialCode={initialCode} />
                  <p className="m-0 text-center text-xs text-office-dim">
                    형식: XXXX-XXXX &nbsp;|&nbsp; 예: IRON-7K2X
                  </p>

                  {/* 구분선 — 입장 / 발급 */}
                  <div className="flex w-full max-w-lg items-center gap-3 py-1">
                    <span className="h-px flex-1 bg-office-border" />
                    <span className="text-[11px] uppercase tracking-wider text-office-dim">
                      또는 새 초대 코드 발급
                    </span>
                    <span className="h-px flex-1 bg-office-border" />
                  </div>

                  <InviteCodeIssuer />
                </div>
              )}
            </div>

            <div id="panel-room" role="tabpanel" aria-labelledby="tab-room" hidden={activeTab !== 'room'}>
              {activeTab === 'room' && <RoomSection />}
            </div>
          </div>
        </main>

        {/* === Footer === */}
        <footer className="mt-12 w-full max-w-sm text-center">
          <p className="mb-4 text-sm text-office-muted">에이전트는 어떻게 등장하나요?</p>
          <div className="rounded-xl border border-office-border bg-office-elevated px-6 py-4 text-left">
            <p className="mb-2 text-xs uppercase tracking-widest text-office-muted">자동 연동</p>
            <p className="text-xs leading-relaxed text-office-dim">
              dk-harness 훅이 설정된 Claude Code 세션을 시작하면, 에이전트가 이 오피스에 자동으로
              등장합니다. 위에서 룸을 만들거나 코드로 입장한 뒤 세션을 실행해 보세요.
            </p>
          </div>
          <p className="mt-3 text-xs text-office-dim">
            자세한 흐름은{' '}
            <Link href="/guide/dashboard" className="text-dk-harness-orange no-underline hover:underline">
              3D 대시보드 사용법
            </Link>
            에서 확인하세요.
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ---- Agent Avatar ---- */

interface AgentAvatarProps {
  readonly id: string;
  readonly name: string;
}

function AgentAvatar({ id, name }: Readonly<AgentAvatarProps>) {
  const screenColor = AGENT_SCREEN_COLORS[id] ?? '#FF6B2C';

  return (
    <div className="group flex flex-col items-center gap-1.5" title={name}>
      <div
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-office-border bg-office-elevated transition-all duration-150 group-hover:scale-110 group-hover:border-dk-harness-orange"
        aria-label={`${name} 에이전트`}
      >
        <AgentSvgIcon id={id} color={screenColor} />
      </div>
      <span className="text-xs text-office-dim transition-colors duration-150 group-hover:text-office-text">
        {name}
      </span>
    </div>
  );
}

/* ---- Agent SVG Icon — 인라인 fallback ---- */

interface AgentSvgIconProps {
  readonly id: string;
  readonly color: string;
}

function AgentSvgIcon({ id, color }: Readonly<AgentSvgIconProps>) {
  const initials = id.slice(0, 2).toUpperCase();
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Monitor body */}
      <rect x="3" y="4" width="22" height="14" rx="2" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.2" />
      {/* Screen */}
      <rect x="5" y="6" width="18" height="10" rx="1" fill={color} fillOpacity="0.25" />
      {/* Stand */}
      <rect x="12" y="18" width="4" height="3" fill={color} fillOpacity="0.4" />
      <rect x="9" y="21" width="10" height="1.5" rx="0.75" fill={color} fillOpacity="0.4" />
      {/* Initials on screen */}
      <text
        x="14"
        y="13"
        textAnchor="middle"
        fontSize="5.5"
        fontWeight="700"
        fontFamily="monospace"
        fill={color}
      >
        {initials}
      </text>
    </svg>
  );
}

/* ---- Tab Button ---- */

interface TabButtonProps {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
  readonly id: string;
  readonly panelId: string;
}

function TabButton({ label, active, onClick, id, panelId }: Readonly<TabButtonProps>) {
  return (
    <button
      id={id}
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      onClick={onClick}
      className={[
        'h-12 flex-1 cursor-pointer border-none bg-transparent font-sans text-sm transition-all duration-150',
        active
          ? 'border-b-2 border-dk-harness-orange font-semibold text-dk-harness-orange'
          : 'border-b-2 border-transparent font-normal text-office-dim hover:text-office-text',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
