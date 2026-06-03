'use client';

import { useState } from 'react';
import Image from 'next/image';
import { InviteCodeInput } from './InviteCodeInput';
import { RoomSection } from './RoomSection';
import { AGENT_CONFIG, AGENT_SCREEN_COLORS } from '@/lib/colors';

export interface LandingPageProps {
  readonly initialCode?: string | null;
}

type ActiveTab = 'invite' | 'room';

export function LandingPage({ initialCode }: Readonly<LandingPageProps>) {
  // 룸 입장이 즉시 사용 가능한 기본 흐름이라 기본 탭으로 둔다.
  // (초대 코드는 ?code/?session 으로 진입한 경우에만 기본 노출)
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialCode ? 'invite' : 'room');

  return (
    <div className="min-h-screen bg-office-bg flex flex-col items-center justify-center px-6 py-10 font-sans text-office-text">
      {/* === Header === */}
      <header className="text-center mb-12">
        <div className="inline-block bg-dk-harness-orange px-4 py-1 rounded-full mb-5">
          <span className="text-xs font-semibold text-white tracking-widest uppercase">
            dk-harness v2.2.3
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-office-text tracking-tight mb-3">
          dk-harness{' '}
          <span className="text-dk-harness-orange">Agent</span>
          {' '}Office
        </h1>

        <p className="text-sm text-office-muted">
          10명의 에이전트가 일하는 3D 오피스
        </p>
      </header>

      {/* === Agent Avatars === */}
      <div className="mb-10 w-full max-w-xl">
        <div className="flex flex-wrap justify-center gap-3">
          {AGENT_CONFIG.map((agent) => (
            <AgentAvatar key={agent.id} id={agent.id} name={agent.name} />
          ))}
        </div>
      </div>

      {/* === Main card === */}
      <main className="w-full max-w-xl bg-office-surface border border-office-border rounded-2xl shadow-lg shadow-dk-harness-orange/5 overflow-hidden">
        {/* Tab bar */}
        <div
          className="flex border-b border-office-border"
          role="tablist"
          aria-label="입장 방식 선택"
        >
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
        <div className="px-8 pt-7 pb-9">
          <div
            id="panel-invite"
            role="tabpanel"
            aria-labelledby="tab-invite"
            hidden={activeTab !== 'invite'}
          >
            {activeTab === 'invite' && (
              <div className="flex flex-col items-center gap-5">
                <p className="text-xs text-office-muted tracking-wider m-0">
                  팀원에게 받은 초대 코드를 입력하세요
                </p>
                <InviteCodeInput initialCode={initialCode} />
                <p className="text-xs text-office-dim text-center m-0">
                  형식: XXXX-XXXX &nbsp;|&nbsp; 예: IRON-7K2X
                </p>
              </div>
            )}
          </div>

          <div
            id="panel-room"
            role="tabpanel"
            aria-labelledby="tab-room"
            hidden={activeTab !== 'room'}
          >
            {activeTab === 'room' && <RoomSection />}
          </div>
        </div>
      </main>

      {/* === Footer === */}
      <footer className="mt-12 text-center w-full max-w-sm">
        <p className="text-sm text-office-muted mb-4">
          에이전트는 어떻게 등장하나요?
        </p>
        <div className="bg-office-elevated rounded-xl px-6 py-4 border border-office-border text-left">
          <p className="text-xs text-office-muted uppercase tracking-widest mb-2">
            자동 연동
          </p>
          <p className="text-xs text-office-dim leading-relaxed">
            dk-harness 훅이 설정된 Claude Code 세션을 시작하면, 에이전트가
            이 오피스에 자동으로 등장합니다. 위에서 룸을 만들거나 코드로 입장한 뒤
            세션을 실행해 보세요.
          </p>
        </div>
        <p className="text-xs text-office-dim mt-3">
          초대 코드는 다른 사람의 세션에 참여할 때만 사용합니다.
        </p>
      </footer>
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
    <div className="flex flex-col items-center gap-1.5 group" title={name}>
      <div
        className="w-10 h-10 rounded-xl bg-office-elevated border border-office-border flex items-center justify-center overflow-hidden transition-all duration-150 group-hover:border-dk-harness-orange group-hover:scale-110"
        aria-label={`${name} 에이전트`}
      >
        <AgentSvgIcon id={id} color={screenColor} />
      </div>
      <span className="text-xs text-office-dim group-hover:text-office-text transition-colors duration-150">
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
        'flex-1 h-12 bg-transparent border-none text-sm font-sans cursor-pointer transition-all duration-150',
        active
          ? 'text-dk-harness-orange border-b-2 border-dk-harness-orange font-semibold'
          : 'text-office-dim border-b-2 border-transparent font-normal hover:text-office-text',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
