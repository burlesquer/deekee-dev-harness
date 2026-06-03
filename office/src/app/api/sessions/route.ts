import { NextRequest, NextResponse } from 'next/server';
import { sessionRegistry } from '@/lib/relay/session-registry';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = (await Promise.resolve(searchParams)).get('teamId');

    const sessions = teamId
      ? sessionRegistry.getByTeam(teamId)
      : sessionRegistry.getAll();

    return NextResponse.json({ sessions, count: sessions.length });
  } catch (err) {
    console.error('[sessions GET]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
