'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type ValidationStatus = 'idle' | 'loading' | 'valid' | 'invalid' | 'expired';

interface ValidationResult {
  status: 'valid' | 'invalid' | 'expired';
  agentName?: string;
  sessionId?: string;
}

export interface InviteCodeInputProps {
  readonly initialCode?: string | null;
  readonly onJoining?: () => void;
}

function formatCode(raw: string): string {
  const clean = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
  if (clean.length <= 4) return clean;
  return `${clean.slice(0, 4)}-${clean.slice(4)}`;
}

async function validateCode(code: string): Promise<ValidationResult> {
  const normalized = code.toUpperCase().trim();
  try {
    const res = await fetch(`/api/sessions/invite/${encodeURIComponent(normalized)}`);
    if (res.status === 404) return { status: 'invalid' };
    if (!res.ok) return { status: 'invalid' };
    const data = (await res.json()) as { status: string; agentName?: string; sessionId?: string };
    if (data.status === 'valid') return { status: 'valid', agentName: data.agentName, sessionId: data.sessionId };
    return { status: 'invalid' };
  } catch {
    return { status: 'invalid' };
  }
}

/** 유효성 상태에 따른 입력 테두리 클래스 */
function inputBorderClass(status: ValidationStatus): string {
  switch (status) {
    case 'valid':   return 'border-status-active shadow-[0_0_0_3px_rgba(34,197,94,0.1)]';
    case 'invalid':
    case 'expired': return 'border-status-blocked';
    case 'loading': return 'border-office-border';
    default:        return 'border-dk-harness-orange/30 focus:border-dk-harness-orange';
  }
}

export function InviteCodeInput({ initialCode, onJoining }: Readonly<InviteCodeInputProps>) {
  const router = useRouter();
  const [value, setValue] = useState(initialCode ? formatCode(initialCode) : '');
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>('idle');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isComplete = value.replace('-', '').length === 8;

  const runValidation = useCallback(async (code: string) => {
    setValidationStatus('loading');
    setJoinError(null);
    const result = await validateCode(code);
    setValidationResult(result);
    setValidationStatus(result.status);
  }, []);

  useEffect(() => {
    if (!isComplete) {
      setValidationStatus('idle');
      setValidationResult(null);
      return;
    }
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => runValidation(value), 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [value, isComplete, runValidation]);

  useEffect(() => {
    if (initialCode && formatCode(initialCode).replace('-', '').length === 8) {
      runValidation(formatCode(initialCode));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setValue(formatCode(e.target.value));

  const handleJoin = async () => {
    if (validationStatus !== 'valid' || isJoining) return;
    setIsJoining(true);
    setJoinError(null);
    onJoining?.();
    try {
      const res = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: value }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setJoinError(data.error ?? '입장에 실패했습니다');
        setIsJoining(false);
        return;
      }
      const data = (await res.json()) as { sessionId: string };
      router.push(`/?session=${encodeURIComponent(data.sessionId)}`);
    } catch {
      setJoinError('서버 연결에 실패했습니다');
      setIsJoining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleJoin();
  };

  const canJoin = validationStatus === 'valid' && !isJoining;

  const statusMessage = (): React.ReactNode => {
    if (joinError) return <span className="text-status-blocked">{joinError}</span>;
    switch (validationStatus) {
      case 'loading': return <span className="text-office-muted">검증 중...</span>;
      case 'valid':   return <span className="text-status-active">{validationResult?.agentName}의 세션 — 입장 가능</span>;
      case 'invalid': return <span className="text-status-blocked">유효하지 않은 코드</span>;
      case 'expired': return <span className="text-status-blocked">만료된 코드</span>;
      default:        return null;
    }
  };

  return (
    <div className="w-full max-w-lg flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="IRON-7K2X"
          maxLength={9}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="characters"
          aria-label="초대 코드 입력"
          className={[
            'flex-1 h-13 bg-office-surface border-2 rounded-xl',
            'text-office-text font-mono text-xl tracking-widest px-4 outline-none',
            'uppercase caret-dk-harness-orange transition-[border-color,box-shadow] duration-150',
            inputBorderClass(validationStatus),
          ].join(' ')}
        />
        <button
          onClick={handleJoin}
          disabled={!canJoin}
          aria-label="입장하기"
          className={[
            'h-13 px-6 rounded-xl text-sm font-semibold font-sans whitespace-nowrap',
            'transition-colors duration-150',
            canJoin
              ? 'bg-dk-harness-orange text-white cursor-pointer hover:bg-dk-harness-orange-hover'
              : 'bg-office-elevated text-office-dim cursor-not-allowed',
          ].join(' ')}
        >
          {isJoining ? '입장 중...' : '입장하기 →'}
        </button>
      </div>

      <div className="text-[13px] min-h-[18px] pl-1 text-office-muted" role="status" aria-live="polite">
        {statusMessage()}
      </div>
    </div>
  );
}
