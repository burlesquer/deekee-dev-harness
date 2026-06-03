import { AGENT_CONFIG, AGENT_SCREEN_COLORS } from '@/lib/colors';

/**
 * 21인 에이전트 로스터 — 매뉴얼 2종이 공유.
 * 이름/역할/모델은 AGENT_CONFIG, 고유 색은 AGENT_SCREEN_COLORS 를 단일 출처로 사용한다.
 * README 의 4개 부서 그룹핑을 그대로 따른다.
 */

interface RosterGroup {
  readonly label: string;
  readonly ids: readonly string[];
}

const ROSTER_GROUPS: readonly RosterGroup[] = [
  { label: '리더십 · 심의', ids: ['simon', 'sam', 'able', 'klay', 'ryan', 'critic', 'noah'] },
  { label: '백엔드 · 인프라', ids: ['jay', 'jerry', 'milla', 'jun', 'kain'] },
  { label: '프론트엔드 · 디자인', ids: ['willji', 'derek', 'rowan', 'figma-reader'] },
  { label: 'AI/ML · 특수', ids: ['jo', 'hugg', 'iron', 'teacher', 'progress-checker'] },
];

/** id → AGENT_CONFIG 엔트리 조회 맵. 키를 string 으로 넓혀 일반 조회를 허용한다. */
const AGENT_BY_ID = new Map<string, (typeof AGENT_CONFIG)[number]>(
  AGENT_CONFIG.map((a) => [a.id, a]),
);

export function AgentRoster() {
  return (
    <div className="flex flex-col gap-7">
      {ROSTER_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.15em] text-office-dim">
            {group.label}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {group.ids.map((id) => (
              <RosterRow key={id} id={id} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface RosterRowProps {
  readonly id: string;
}

function RosterRow({ id }: Readonly<RosterRowProps>) {
  const agent = AGENT_BY_ID.get(id);
  if (!agent) return null;
  const color = AGENT_SCREEN_COLORS[id] ?? '#FF6B2C';

  return (
    <div className="flex items-center gap-3 rounded-lg border border-office-border bg-office-surface px-3 py-2.5">
      <span
        className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="font-mono text-sm font-bold text-office-text">{agent.name}</span>
      <span className="text-xs text-office-muted">{agent.role}</span>
      <span className="ml-auto rounded border border-office-border px-1.5 py-0.5 font-mono text-[10px] text-office-dim">
        {agent.model}
      </span>
    </div>
  );
}
