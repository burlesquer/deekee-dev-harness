'use client';

import { useCallback, useState } from 'react';
import { AGENT_CONFIG } from '@/lib/colors';

/** 발급 만료 옵션. label 은 표시용, ms 는 서버 expiresInMs. */
const EXPIRY_OPTIONS: readonly { readonly label: string; readonly ms: number }[] = [
  { label: '5분', ms: 5 * 60 * 1000 },
  { label: '1시간', ms: 60 * 60 * 1000 },
  { label: '24시간', ms: 24 * 60 * 60 * 1000 },
];

interface IssuedInvite {
  readonly code: string;
  readonly sessionId: string;
  readonly createdBy: string;
  readonly expiresAt: number;
}

/** 발급된 코드의 만료 시각을 로컬 시간 문자열로 표시. */
function formatExpiry(expiresAt: number): string {
  try {
    return new Date(expiresAt).toLocaleString('ko-KR', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * 초대 코드 발급 UI. 에이전트 정체성 + 만료를 골라 코드를 발급하고,
 * 발급된 코드(예: IRON-7K2X)를 복사할 수 있게 한다.
 */
export function InviteCodeIssuer() {
  const [agentName, setAgentName] = useState('Iron');
  const [expiresInMs, setExpiresInMs] = useState<number>(60 * 60 * 1000);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issued, setIssued] = useState<IssuedInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleIssue = useCallback(async () => {
    if (isIssuing) return;
    setIsIssuing(true);
    setError(null);
    setCopied(false);
    try {
      const res = await fetch('/api/sessions/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName, expiresInMs }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? '발급에 실패했습니다');
        return;
      }
      const data = (await res.json()) as IssuedInvite;
      setIssued(data);
    } catch {
      setError('서버 연결에 실패했습니다');
    } finally {
      setIsIssuing(false);
    }
  }, [agentName, expiresInMs, isIssuing]);

  const handleCopy = useCallback(async () => {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('클립보드 복사에 실패했습니다');
    }
  }, [issued]);

  return (
    <section aria-label="초대 코드 발급" className="w-full max-w-lg flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        {/* Agent picker */}
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-office-dim">
          에이전트
          <select
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            aria-label="발급 에이전트 선택"
            className="h-11 min-w-[120px] rounded-xl border-2 border-office-border bg-office-surface px-3 font-mono text-sm text-office-text outline-none transition-[border-color] duration-150 focus:border-dk-harness-orange"
          >
            {AGENT_CONFIG.map((a) => (
              <option key={a.id} value={a.name}>
                {a.name}
              </option>
            ))}
          </select>
        </label>

        {/* Expiry picker */}
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-office-dim">
          만료
          <select
            value={expiresInMs}
            onChange={(e) => setExpiresInMs(Number(e.target.value))}
            aria-label="만료 시간 선택"
            className="h-11 min-w-[90px] rounded-xl border-2 border-office-border bg-office-surface px-3 font-mono text-sm text-office-text outline-none transition-[border-color] duration-150 focus:border-dk-harness-orange"
          >
            {EXPIRY_OPTIONS.map((o) => (
              <option key={o.ms} value={o.ms}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        {/* Issue button */}
        <button
          onClick={handleIssue}
          disabled={isIssuing}
          aria-label="초대 코드 발급"
          className={[
            'h-11 flex-1 rounded-xl px-5 font-sans text-sm font-semibold whitespace-nowrap transition-colors duration-150',
            isIssuing
              ? 'cursor-not-allowed bg-office-elevated text-office-dim'
              : 'cursor-pointer bg-dk-harness-orange text-white hover:bg-dk-harness-orange-hover',
          ].join(' ')}
        >
          {isIssuing ? '발급 중...' : '초대 코드 발급'}
        </button>
      </div>

      {/* Issued code chip */}
      {issued && (
        <div className="flex flex-col gap-2 rounded-xl border border-status-active/40 bg-office-surface px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span
              className="font-mono text-xl font-bold tracking-widest text-status-active"
              aria-label="발급된 초대 코드"
            >
              {issued.code}
            </span>
            <button
              onClick={handleCopy}
              aria-label="초대 코드 복사"
              className="h-9 shrink-0 rounded-lg border border-dk-harness-orange bg-transparent px-3 font-mono text-xs font-bold text-dk-harness-orange transition-colors duration-150 hover:bg-dk-harness-orange hover:text-white"
            >
              {copied ? '복사됨 ✓' : '코드 복사'}
            </button>
          </div>
          <div className="font-mono text-[11px] text-office-dim">
            {issued.createdBy}의 세션 · 만료 {formatExpiry(issued.expiresAt)}
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="font-mono text-xs text-status-blocked">
          [ERR] {error}
        </div>
      )}
    </section>
  );
}
