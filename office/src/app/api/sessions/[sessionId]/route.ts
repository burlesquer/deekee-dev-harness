import { NextResponse } from 'next/server';
import { sessionRegistry } from '@/lib/relay/session-registry';

// GET /api/sessions/:sessionId — 개별 세션 상세 (공유 링크용)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const session = sessionRegistry.getAll().find((s) => s.sessionId === sessionId);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // 공유 정보 포함
  return NextResponse.json({
    session,
    shareUrl: `/shared/${sessionId}`,
    canRemoteControl: session.sharing?.allowRemoteControl ?? false,
  });
}
