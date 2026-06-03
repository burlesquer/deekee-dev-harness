'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateRoomModal } from './CreateRoomModal';

export interface RoomInfo {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly isPublic: boolean;
  readonly memberCount: number;
  readonly maxMembers: number;
  readonly allowSpectators: boolean;
}

export interface RoomSectionProps {
  readonly onEntering?: () => void;
}

function formatRoomCode(raw: string): string {
  const clean = raw.replace(/[^A-Za-z0-9-]/g, '').toUpperCase().slice(0, 12);
  return clean;
}

export function RoomSection({ onEntering }: Readonly<RoomSectionProps>) {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomInfo[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [isEntering, setIsEntering] = useState(false);
  const [enterError, setEnterError] = useState<string | null>(null);

  const fetchPublicRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/rooms?public=true');
      if (!res.ok) throw new Error('룸 목록을 불러오지 못했습니다');
      const data = (await res.json()) as { rooms: RoomInfo[] };
      setRooms(data.rooms ?? []);
    } catch {
      setLoadError('룸 목록을 불러오지 못했습니다');
      setRooms([]);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicRooms();
  }, [fetchPublicRooms]);

  const handleEnterRoom = useCallback(
    async (roomId: string) => {
      if (isEntering) return;
      setIsEntering(true);
      setEnterError(null);
      onEntering?.();
      try {
        router.push(`/?room=${encodeURIComponent(roomId)}`);
      } catch {
        setEnterError('룸 입장에 실패했습니다');
        setIsEntering(false);
      }
    },
    [isEntering, onEntering, router],
  );

  const handleEnterByCode = useCallback(async () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!code || isEntering) return;
    setIsEntering(true);
    setEnterError(null);
    onEntering?.();
    try {
      const res = await fetch(`/api/rooms/by-code/${encodeURIComponent(code)}`);
      if (!res.ok) {
        setEnterError('유효하지 않은 룸 코드입니다');
        setIsEntering(false);
        return;
      }
      const data = (await res.json()) as { id: string };
      router.push(`/?room=${encodeURIComponent(data.id)}`);
    } catch {
      setEnterError('서버 연결에 실패했습니다');
      setIsEntering(false);
    }
  }, [roomCodeInput, isEntering, onEntering, router]);

  const handleRoomCreated = useCallback(
    (roomId: string) => {
      setShowCreateModal(false);
      router.push(`/?room=${encodeURIComponent(roomId)}`);
    },
    [router],
  );

  const canEnterByCode = Boolean(roomCodeInput.trim()) && !isEntering;

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Create Room Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        aria-label="새 룸 만들기"
        className="w-full h-12 bg-dk-harness-orange border-2 border-dk-harness-orange text-white font-mono text-sm font-bold tracking-wider cursor-pointer transition-colors duration-150 hover:bg-dk-harness-orange-hover hover:border-dk-harness-orange-hover rounded-lg"
      >
        + 룸 만들기
      </button>

      {/* Public Room List */}
      <section aria-label="공개 룸 목록">
        <div className="text-xs text-office-dim uppercase tracking-[0.15em] mb-3">
          공개 룸
        </div>

        {isLoadingRooms && (
          <div className="py-5 text-center font-mono text-xs text-office-dim">
            불러오는 중...
          </div>
        )}

        {!isLoadingRooms && loadError && (
          <div
            role="alert"
            className="px-4 py-3 border border-error-border bg-error-bg font-mono text-xs text-status-blocked flex items-center justify-between gap-3"
          >
            <span>{loadError}</span>
            <button
              onClick={fetchPublicRooms}
              className="bg-transparent border border-status-blocked text-status-blocked font-mono text-xs cursor-pointer px-2 py-0.5 hover:bg-status-blocked/10 transition-colors duration-150"
            >
              재시도
            </button>
          </div>
        )}

        {!isLoadingRooms && !loadError && rooms.length === 0 && (
          <div className="py-6 text-center font-mono text-xs text-office-faint">
            아직 공개 룸이 없습니다
          </div>
        )}

        {!isLoadingRooms && !loadError && rooms.length > 0 && (
          <div className="flex flex-col gap-2">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onEnter={handleEnterRoom}
                disabled={isEntering}
              />
            ))}
          </div>
        )}
      </section>

      {/* Private Room Code Entry */}
      <section aria-label="비공개 룸 입장">
        <div className="text-xs text-office-dim uppercase tracking-[0.15em] mb-3">
          룸 코드로 입장
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(formatRoomCode(e.target.value))}
            onKeyDown={(e) => { if (e.key === 'Enter') handleEnterByCode(); }}
            placeholder="DK-A1B2"
            maxLength={12}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="characters"
            aria-label="룸 코드 입력"
            className="flex-1 h-11 bg-office-surface border-2 border-office-border text-office-text font-mono text-base tracking-wider px-3 outline-none uppercase caret-dk-harness-orange transition-[border-color] duration-150 focus:border-dk-harness-orange"
          />
          <button
            onClick={handleEnterByCode}
            disabled={!canEnterByCode}
            aria-label="룸 코드로 입장"
            className={[
              'h-11 px-5 font-mono text-[13px] font-bold whitespace-nowrap border-2 transition-colors duration-150',
              canEnterByCode
                ? 'bg-dk-harness-orange border-dk-harness-orange text-white cursor-pointer hover:bg-dk-harness-orange-hover hover:border-dk-harness-orange-hover'
                : 'bg-office-action-disabled border-office-action-disabled-border text-office-action-disabled-text cursor-not-allowed',
            ].join(' ')}
          >
            {isEntering ? '입장 중...' : '입장'}
          </button>
        </div>

        {enterError && (
          <div role="alert" className="mt-2 font-mono text-xs text-status-blocked">
            [ERR] {enterError}
          </div>
        )}
      </section>

      {/* Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleRoomCreated}
        />
      )}
    </div>
  );
}

interface RoomCardProps {
  readonly room: RoomInfo;
  readonly onEnter: (roomId: string) => void;
  readonly disabled: boolean;
}

function RoomCard({ room, onEnter, disabled }: Readonly<RoomCardProps>) {
  return (
    <div className="bg-office-surface border border-office-border px-4 py-3.5 flex items-center justify-between gap-3 transition-[border-color] duration-150 hover:border-dk-harness-orange">
      <div className="flex-1 min-w-0">
        <div className="font-mono text-sm font-bold text-office-text truncate mb-1.5">
          {room.name}
        </div>
        <div className="font-mono text-xs text-office-muted flex items-center gap-2.5">
          <span>{room.memberCount}/{room.maxMembers} members</span>
          <span className="text-office-border">|</span>
          <span className={room.isPublic ? 'text-status-active' : 'text-status-offline'}>
            {room.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
      </div>

      <button
        onClick={() => onEnter(room.id)}
        disabled={disabled}
        aria-label={`${room.name} 룸 입장하기`}
        className={[
          'h-9 px-4 bg-transparent border border-dk-harness-orange text-dk-harness-orange',
          'font-mono text-xs font-bold whitespace-nowrap flex-shrink-0',
          'transition-[background,color] duration-150',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:bg-dk-harness-orange hover:text-white',
        ].join(' ')}
      >
        입장하기 &rarr;
      </button>
    </div>
  );
}
