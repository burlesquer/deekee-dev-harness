'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getClientId } from '@/lib/client-id';

export interface CreateRoomModalProps {
  readonly onClose: () => void;
  readonly onCreated: (roomId: string) => void;
}

interface CreateRoomPayload {
  name: string;
  ownerId: string;
  isPublic: boolean;
  maxMembers: number;
  allowSpectators: boolean;
}

interface CreateRoomResponse {
  id: string;
  code: string;
  name: string;
}

export function CreateRoomModal({ onClose, onCreated }: Readonly<CreateRoomModalProps>) {
  const [name, setName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [maxMembers, setMaxMembers] = useState(10);
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRoom, setCreatedRoom] = useState<CreateRoomResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    const payload: CreateRoomPayload = {
      name: trimmedName,
      ownerId: getClientId(),
      isPublic,
      maxMembers,
      allowSpectators,
    };

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? '룸 생성에 실패했습니다');
        setIsSubmitting(false);
        return;
      }

      // API는 { ok: true, room: {...} } 형태로 감싸서 반환한다.
      const data = (await res.json()) as { room?: CreateRoomResponse };
      if (!data.room) {
        setError('룸 생성 응답이 올바르지 않습니다');
        setIsSubmitting(false);
        return;
      }
      setCreatedRoom(data.room);
      setIsSubmitting(false);
    } catch {
      setError('서버 연결에 실패했습니다');
      setIsSubmitting(false);
    }
  }, [name, isPublic, maxMembers, allowSpectators, isSubmitting]);

  const handleCopyCode = useCallback(async () => {
    if (!createdRoom) return;
    try {
      await navigator.clipboard.writeText(createdRoom.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: ignore clipboard errors
    }
  }, [createdRoom]);

  const handleEnterRoom = useCallback(() => {
    if (!createdRoom) return;
    onCreated(createdRoom.id);
  }, [createdRoom, onCreated]);

  const canSubmit = Boolean(name.trim()) && !isSubmitting;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="룸 만들기"
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-6"
    >
      <div
        className="w-full max-w-lg bg-office-bg border-2 border-dk-harness-orange shadow-[6px_6px_0px_rgba(255,107,44,0.2)] flex flex-col font-mono text-office-text"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-office-border flex items-center justify-between">
          <span className="text-[13px] text-dk-harness-orange uppercase tracking-[0.15em] font-bold">
            {'>'} 룸 만들기
          </span>
          <button
            onClick={onClose}
            aria-label="모달 닫기"
            className="bg-transparent border border-office-border text-office-dim font-mono text-sm cursor-pointer w-6 h-6 flex items-center justify-center p-0 leading-none hover:border-office-border-muted hover:text-office-muted transition-colors duration-150"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-5 py-6 flex flex-col gap-5">
          {createdRoom ? (
            <SuccessView
              room={createdRoom}
              copied={copied}
              onCopy={handleCopyCode}
              onEnter={handleEnterRoom}
              onClose={onClose}
            />
          ) : (
            <>
              {/* Room Name */}
              <FormField label="룸 이름" required>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 128))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                  placeholder="예: 결제 시스템 개발"
                  maxLength={128}
                  aria-label="룸 이름"
                  aria-required="true"
                  className="w-full h-11 bg-office-surface border-2 border-office-border text-office-text font-mono text-sm px-3 outline-none caret-dk-harness-orange transition-[border-color] duration-150 focus:border-dk-harness-orange box-border"
                />
                <div className="text-[10px] text-office-dim text-right mt-1">
                  {name.length}/128
                </div>
              </FormField>

              {/* Public Toggle */}
              <FormField label="공개 여부">
                <ToggleRow
                  label={isPublic ? '공개 — 누구나 입장 가능' : '비공개 — 코드로만 입장'}
                  checked={isPublic}
                  onChange={setIsPublic}
                  id="room-public-toggle"
                />
              </FormField>

              {/* Max Members */}
              <FormField label="최대 인원">
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={maxMembers}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1));
                      setMaxMembers(v);
                    }}
                    min={1}
                    max={50}
                    aria-label="최대 인원"
                    className="w-20 h-11 bg-office-surface border-2 border-office-border text-office-text font-mono text-sm text-center outline-none caret-dk-harness-orange transition-[border-color] duration-150 focus:border-dk-harness-orange box-border"
                  />
                  <span className="text-xs text-office-muted">명 (1 ~ 50)</span>
                </div>
              </FormField>

              {/* Allow Spectators */}
              <FormField label="관전 허용">
                <ToggleRow
                  label={allowSpectators ? '관전 허용' : '관전 불허'}
                  checked={allowSpectators}
                  onChange={setAllowSpectators}
                  id="room-spectator-toggle"
                />
              </FormField>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="px-3 py-2.5 bg-error-bg border border-error-border font-mono text-xs text-status-blocked"
                >
                  [ERR] {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2.5 mt-1">
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  aria-label="룸 만들기"
                  className={[
                    'flex-1 h-11 border-2 font-mono text-sm font-bold transition-[background,border-color] duration-150',
                    canSubmit
                      ? 'bg-dk-harness-orange border-dk-harness-orange text-white cursor-pointer hover:bg-dk-harness-orange-hover hover:border-dk-harness-orange-hover'
                      : 'bg-office-action-disabled border-office-action-disabled-border text-office-action-disabled-text cursor-not-allowed',
                  ].join(' ')}
                >
                  {isSubmitting ? '생성 중...' : '만들기'}
                </button>
                <button
                  onClick={onClose}
                  aria-label="취소"
                  className="h-11 px-5 bg-transparent border-2 border-office-border text-office-dim font-mono text-sm cursor-pointer transition-[border-color,color] duration-150 hover:border-office-border-muted hover:text-office-muted"
                >
                  취소
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

interface FormFieldProps {
  readonly label: string;
  readonly required?: boolean;
  readonly children: React.ReactNode;
}

function FormField({ label, required, children }: Readonly<FormFieldProps>) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] text-office-dim uppercase tracking-[0.12em]">
        {label}
        {required && <span className="text-dk-harness-orange ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

interface ToggleRowProps {
  readonly label: string;
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
  readonly id: string;
}

function ToggleRow({ label, checked, onChange, id }: Readonly<ToggleRowProps>) {
  return (
    <div className="flex items-center gap-3">
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'w-10 h-[22px] border-2 cursor-pointer relative flex-shrink-0 p-0',
          'transition-[background,border-color] duration-150',
          checked
            ? 'bg-dk-harness-orange border-dk-harness-orange'
            : 'bg-office-action-disabled border-office-action-disabled-border',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 w-3.5 h-3.5 bg-white transition-[left] duration-150',
            checked ? 'left-[18px]' : 'left-0.5',
          ].join(' ')}
        />
      </button>
      <span className="text-[13px] text-office-muted">{label}</span>
    </div>
  );
}

interface SuccessViewProps {
  readonly room: CreateRoomResponse;
  readonly copied: boolean;
  readonly onCopy: () => void;
  readonly onEnter: () => void;
  readonly onClose: () => void;
}

function SuccessView({ room, copied, onCopy, onEnter, onClose }: Readonly<SuccessViewProps>) {
  return (
    <div className="flex flex-col gap-5">
      <div className="p-4 bg-success-bg border border-success-border flex flex-col gap-2">
        <div className="text-[11px] text-status-active uppercase tracking-[0.12em]">
          [OK] 룸 생성 완료
        </div>
        <div className="text-lg font-bold text-office-text">{room.name}</div>
      </div>

      {/* Room code display */}
      <div className="flex flex-col gap-2">
        <div className="text-[11px] text-office-dim uppercase tracking-[0.12em]">
          룸 코드
        </div>
        <div className="flex gap-2 items-stretch">
          <div className="flex-1 px-4 py-3 bg-office-surface border-2 border-dk-harness-orange text-xl font-bold text-dk-harness-orange tracking-[0.15em] text-center">
            {room.code}
          </div>
          <button
            onClick={onCopy}
            aria-label="룸 코드 복사"
            className={[
              'px-4 border-2 font-mono text-xs cursor-pointer whitespace-nowrap',
              'transition-[background,border-color,color] duration-150',
              copied
                ? 'bg-success-bg border-success-border text-status-active'
                : 'bg-office-action-disabled border-office-action-disabled-border text-office-dim hover:border-office-border-muted',
            ].join(' ')}
          >
            {copied ? '[복사됨]' : '코드 복사'}
          </button>
        </div>
      </div>

      <div className="flex gap-2.5">
        <button
          onClick={onEnter}
          aria-label="룸 입장하기"
          className="flex-1 h-11 bg-dk-harness-orange border-2 border-dk-harness-orange text-white font-mono text-sm font-bold cursor-pointer transition-colors duration-150 hover:bg-dk-harness-orange-hover hover:border-dk-harness-orange-hover"
        >
          룸 입장하기 &rarr;
        </button>
        <button
          onClick={onClose}
          aria-label="닫기"
          className="h-11 px-5 bg-transparent border-2 border-office-border text-office-dim font-mono text-sm cursor-pointer hover:border-office-border-muted transition-[border-color] duration-150"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
