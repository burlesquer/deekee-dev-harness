'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/** API가 반환하는 원본 Room shape(필요한 필드만). */
interface ApiRoom {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly members: readonly unknown[];
  readonly settings: {
    readonly maxMembers: number;
    readonly isPublic: boolean;
  };
}

interface MyRoom {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly memberCount: number;
  readonly maxMembers: number;
  readonly isPublic: boolean;
}

function toMyRoom(r: ApiRoom): MyRoom {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    memberCount: Array.isArray(r.members) ? r.members.length : 0,
    maxMembers: r.settings?.maxMembers ?? 0,
    isPublic: r.settings?.isPublic ?? false,
  };
}

/**
 * 내가 만든 룸 관리 — 목록 조회 + 삭제.
 * 소유자 식별은 localStorage clientId(= 룸 ownerId)로 한다.
 */
export function RoomManager() {
  const router = useRouter();
  const [rooms, setRooms] = useState<MyRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMyRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 서명된 신원 쿠키로 "내 룸"을 조회한다(같은 출처 fetch 라 쿠키 자동 전송).
      const res = await fetch('/api/rooms?mine=true');
      if (!res.ok) throw new Error('fetch failed');
      const data = (await res.json()) as { rooms: ApiRoom[] };
      setRooms((data.rooms ?? []).map(toMyRoom));
    } catch {
      setError('내 룸을 불러오지 못했습니다');
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRooms();
  }, [fetchMyRooms]);

  const handleDelete = useCallback(
    async (roomId: string) => {
      if (deletingId) return;
      setDeletingId(roomId);
      setError(null);
      try {
        // 삭제 인가는 서명된 신원 쿠키로 처리된다(헤더로 ownerId 를 보내지 않는다).
        const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          setError('룸 삭제에 실패했습니다');
          return;
        }
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
      } catch {
        setError('서버 연결에 실패했습니다');
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId],
  );

  const handleEnter = useCallback(
    (roomId: string) => {
      router.push(`/?room=${encodeURIComponent(roomId)}`);
    },
    [router],
  );

  // 로딩 중이거나 내 룸이 하나도 없으면 섹션 자체를 숨겨 랜딩을 깔끔히 유지한다.
  if (isLoading || (!error && rooms.length === 0)) return null;

  return (
    <section aria-label="내 룸 관리">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.15em] text-office-dim">내 룸</div>
        <button
          onClick={fetchMyRooms}
          aria-label="내 룸 새로고침"
          className="bg-transparent font-mono text-[11px] text-office-dim transition-colors duration-150 hover:text-office-text"
        >
          새로고침
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-2 font-mono text-xs text-status-blocked">
          [ERR] {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="flex items-center justify-between gap-3 border border-office-border bg-office-surface px-4 py-3 transition-[border-color] duration-150 hover:border-dk-harness-orange"
          >
            <div className="min-w-0 flex-1">
              <div className="mb-1 truncate font-mono text-sm font-bold text-office-text">
                {room.name}
              </div>
              <div className="flex items-center gap-2.5 font-mono text-xs text-office-muted">
                <span className="text-dk-harness-orange">{room.code}</span>
                <span className="text-office-border">|</span>
                <span>{room.memberCount}/{room.maxMembers}</span>
                <span className="text-office-border">|</span>
                <span className={room.isPublic ? 'text-status-active' : 'text-status-offline'}>
                  {room.isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>

            <div className="flex flex-shrink-0 gap-1.5">
              <button
                onClick={() => handleEnter(room.id)}
                aria-label={`${room.name} 입장`}
                className="h-9 border border-dk-harness-orange bg-transparent px-3 font-mono text-xs font-bold text-dk-harness-orange transition-[background,color] duration-150 hover:bg-dk-harness-orange hover:text-white"
              >
                입장
              </button>
              <button
                onClick={() => handleDelete(room.id)}
                disabled={deletingId === room.id}
                aria-label={`${room.name} 삭제`}
                className={[
                  'h-9 border px-3 font-mono text-xs font-bold transition-[background,color] duration-150',
                  deletingId === room.id
                    ? 'cursor-not-allowed border-office-border text-office-dim'
                    : 'cursor-pointer border-status-blocked text-status-blocked hover:bg-status-blocked hover:text-white',
                ].join(' ')}
              >
                {deletingId === room.id ? '삭제 중' : '삭제'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
