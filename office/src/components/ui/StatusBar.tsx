'use client';

import { useOfficeStore } from '@/stores/office-store';

const PIPELINE_STAGES = ['plan', 'exec', 'verify', 'fix'] as const;

interface StatusBarProps {
  version?: string;
}

export function StatusBar({ version = '0.1.0' }: Readonly<StatusBarProps>) {
  const sessions = useOfficeStore((s) => s.sessions);
  const approvals = useOfficeStore((s) => s.approvals);
  const setActiveApproval = useOfficeStore((s) => s.setActiveApproval);
  const projectName = useOfficeStore((s) => s.projectName);
  const pipelinePhase = useOfficeStore((s) => s.pipelinePhase);

  const pendingApprovals = approvals.filter((a) => a.status === 'pending');
  const pendingCount = pendingApprovals.length;

  const sessionList = Array.from(sessions.values());
  const activeCount = sessionList.filter((s) => s.status === 'active').length;
  const totalCount = sessionList.length;

  return (
    <div className="flex h-8 shrink-0 select-none items-center justify-between border-t border-dk-harness-orange/15 bg-dk-harness-light px-3 font-mono text-[11px] text-dk-harness-muted">
      {/* Left: project name (if available) + active agent count */}
      <span className="flex items-center gap-2">
        {projectName && (
          <>
            <span className="text-dk-harness-dark font-semibold">{projectName}</span>
            <span className="text-dk-harness-muted/40">|</span>
          </>
        )}
        <span>
          Active:{' '}
          <span className="text-status-active">{activeCount}</span>
          {'/'}
          <span className="text-dk-harness-dark">{totalCount}</span>
          {' agents'}
        </span>
      </span>

      {/* Center: pipeline stages */}
      <span className="flex items-center gap-1.5">
        {pipelinePhase ? (
          <DynamicPipeline currentPhase={pipelinePhase} />
        ) : (
          <StaticPipeline />
        )}
      </span>

      {/* Right: pending approvals + version */}
      <span className="flex items-center gap-2.5">
        {pendingCount > 0 && (
          <button
            onClick={() => {
              const first = pendingApprovals[0];
              if (first) setActiveApproval(first.id);
            }}
            title={`${pendingCount} pending approval(s) — click to review`}
            className="cursor-pointer border-none bg-transparent p-0 font-mono text-[11px] animate-pulse"
          >
            <span className="text-status-blocked">&#9888;&#65039; Pending: {pendingCount}</span>
          </button>
        )}
        <span className="text-dk-harness-muted/40">dk-harness-office v{version}</span>
      </span>
    </div>
  );
}

function StaticPipeline() {
  return (
    <>
      <PipelineStage label="plan" status="done" />
      <span className="text-dk-harness-muted/40">→</span>
      <PipelineStage label="exec" status="active" />
      <span className="text-dk-harness-muted/40">→</span>
      <PipelineStage label="verify" status="pending" />
    </>
  );
}

interface DynamicPipelineProps {
  currentPhase: string;
}

function DynamicPipeline({ currentPhase }: Readonly<DynamicPipelineProps>) {
  const normalized = currentPhase.toLowerCase();
  const currentIndex = PIPELINE_STAGES.indexOf(normalized as typeof PIPELINE_STAGES[number]);

  return (
    <>
      {PIPELINE_STAGES.map((stage, index) => {
        let status: 'done' | 'active' | 'pending';
        if (currentIndex === -1) {
          // Unknown phase — show the raw phase label as active
          status = stage === PIPELINE_STAGES[0] ? 'active' : 'pending';
        } else if (index < currentIndex) {
          status = 'done';
        } else if (index === currentIndex) {
          status = 'active';
        } else {
          status = 'pending';
        }
        return (
          <span key={stage} className="flex items-center gap-1.5">
            {index > 0 && <span className="text-dk-harness-muted/40">→</span>}
            <PipelineStage label={stage} status={status} />
          </span>
        );
      })}
      {currentIndex === -1 && (
        <>
          <span className="text-dk-harness-muted/40">→</span>
          <PipelineStage label={currentPhase} status="active" />
        </>
      )}
    </>
  );
}

interface PipelineStageProps {
  label: string;
  status: 'done' | 'active' | 'pending';
}

function PipelineStage({ label, status }: Readonly<PipelineStageProps>) {
  const icon = status === 'done' ? '✅' : status === 'active' ? '🔄' : '⏳';
  const colorClass = status === 'done' ? 'text-status-active' : status === 'active' ? 'text-status-idle' : 'text-dk-harness-muted/40';
  return (
    <span className={colorClass}>
      {label} {icon}
    </span>
  );
}
