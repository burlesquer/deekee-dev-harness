import { NextResponse } from 'next/server';
import { inviteRegistry } from '@/lib/relay/invite-registry';

// GET /api/sessions/invite/:code — 초대 코드 검증
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalized = code.toUpperCase().trim();
  const invite = inviteRegistry.validate(normalized);

  if (!invite) {
    // 만료 여부 판별: invites 내부에 만료된 코드가 있는지 확인
    // validate는 만료/무효 모두 null 반환하므로 status로 구분 불가
    // 단순히 invalid로 처리 (만료 판별은 클라이언트 불필요)
    return NextResponse.json(
      { status: 'invalid', message: '유효하지 않은 코드입니다' },
      { status: 404 },
    );
  }

  return NextResponse.json({
    status: 'valid',
    sessionId: invite.sessionId,
    agentName: invite.createdBy,
    teamId: invite.teamId,
  });
}
