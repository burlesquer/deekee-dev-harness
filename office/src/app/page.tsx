'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { OfficeView } from '@/components/office/OfficeView';
import { LandingPage } from '@/components/landing/LandingPage';

function PageLoading() {
  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FF6B2C',
        fontFamily: 'monospace',
        fontSize: '14px',
      }}
    >
      Loading...
    </div>
  );
}

function PageContent() {
  const searchParams = useSearchParams();
  const sessionParam = searchParams.get('session');
  const codeParam = searchParams.get('code');
  const roomParam = searchParams.get('room');
  const projectParam = searchParams.get('project');
  const userParam = searchParams.get('user');
  const teamParam = searchParams.get('team');
  const agentsParam = searchParams.get('agents'); // JSON string
  const pipelineParam = searchParams.get('pipeline'); // JSON string

  if (sessionParam || roomParam) {
    const initialAgents = parseJson<Array<{ name: string; actions: number; status: string }>>(agentsParam);
    const initialPipeline = parseJson<{ phase: string; task: string; progress: number | null }>(pipelineParam);

    return (
      <OfficeView
        sessionId={sessionParam ?? undefined}
        roomId={roomParam ?? undefined}
        projectName={projectParam ?? undefined}
        userName={userParam ?? undefined}
        teamId={teamParam ?? undefined}
        initialAgents={initialAgents ?? undefined}
        initialPipeline={initialPipeline ?? undefined}
      />
    );
  }

  return <LandingPage initialCode={codeParam} />;
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function Home() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PageContent />
    </Suspense>
  );
}
