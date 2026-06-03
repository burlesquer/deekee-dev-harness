import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * 매뉴얼 2종(harness 사용법 / 3D 대시보드)이 공유하는 셸 + 프리미티브.
 * body 전역이 overflow:hidden 이라 자체 스크롤 컨테이너(h-screen overflow-y-auto)로 감싼다.
 * 인터랙션이 없어 'use client' 없이 서버 컴포넌트로 둔다.
 */

export const OFFICE_URL = 'https://office-black-zeta.vercel.app';
export const GITHUB_URL = 'https://github.com/burlesquer/deekee-dev-harness';

type GuideKey = 'harness' | 'dashboard' | 'manual';

export interface GuideShellProps {
  readonly active: GuideKey;
  readonly children: ReactNode;
}

export function GuideShell({ active, children }: Readonly<GuideShellProps>) {
  return (
    <div className="h-screen overflow-y-auto bg-office-bg text-office-text font-sans">
      {/* === 상단 네비 (스크롤 고정) === */}
      <header className="sticky top-0 z-10 border-b border-office-border bg-office-bg/85 backdrop-blur">
        <nav className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-6">
          <Link href="/" className="flex items-center gap-2 no-underline" aria-label="홈으로">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-dk-harness-orange" />
            <span className="font-mono text-sm font-bold text-office-text">dk-harness</span>
          </Link>

          <div className="ml-auto flex items-center gap-1">
            <GuideNavLink href="/guide" label="harness" active={active === 'harness'} />
            <GuideNavLink href="/guide/manual" label="전체 매뉴얼" active={active === 'manual'} />
            <GuideNavLink href="/guide/dashboard" label="3D 대시보드" active={active === 'dashboard'} />
          </div>

          <Link
            href="/"
            className="ml-2 rounded-lg border border-dk-harness-orange px-3 py-1.5 font-mono text-xs font-bold text-dk-harness-orange no-underline transition-colors duration-150 hover:bg-dk-harness-orange hover:text-white"
          >
            오피스 &rarr;
          </Link>
        </nav>
      </header>

      {/* === 본문 === */}
      <main className="mx-auto max-w-3xl px-6 py-14">{children}</main>

      {/* === 푸터 === */}
      <footer className="border-t border-office-border">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-2 px-6 py-10 text-center">
          <p className="m-0 text-xs text-office-muted">dk-harness · 21명의 에이전트가 일하는 엔지니어링 하네스</p>
          <div className="flex items-center gap-4">
            <a href={GITHUB_URL} className="font-mono text-xs text-dk-harness-orange no-underline hover:underline" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <span className="text-office-faint">·</span>
            <a href={OFFICE_URL} className="font-mono text-xs text-dk-harness-orange no-underline hover:underline" target="_blank" rel="noreferrer">
              라이브 오피스
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---- 상단 네비 링크 ---- */

interface GuideNavLinkProps {
  readonly href: string;
  readonly label: string;
  readonly active: boolean;
}

function GuideNavLink({ href, label, active }: Readonly<GuideNavLinkProps>) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={[
        'rounded-lg px-3 py-1.5 font-mono text-xs no-underline transition-colors duration-150',
        active
          ? 'bg-office-elevated font-bold text-office-text'
          : 'font-normal text-office-dim hover:text-office-text',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

/* ---- 히어로 ---- */

export interface GuideHeroProps {
  readonly badge: string;
  readonly title: ReactNode;
  readonly children: ReactNode;
}

export function GuideHero({ badge, title, children }: Readonly<GuideHeroProps>) {
  return (
    <section className="mb-16">
      <span className="mb-4 inline-block rounded-full bg-dk-harness-orange px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
        {badge}
      </span>
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-office-text sm:text-4xl">{title}</h1>
      <div className="text-base leading-relaxed text-office-muted">{children}</div>
    </section>
  );
}

/* ---- 섹션 (앵커 포함) ---- */

export interface GuideSectionProps {
  readonly id: string;
  readonly index: string;
  readonly title: string;
  readonly children: ReactNode;
}

export function GuideSection({ id, index, title, children }: Readonly<GuideSectionProps>) {
  return (
    <section id={id} className="mb-14 scroll-mt-20">
      <h2 className="mb-5 flex items-baseline gap-3 text-xl font-bold text-office-text">
        <span className="font-mono text-sm text-dk-harness-orange">{index}</span>
        {title}
      </h2>
      <div className="text-sm leading-relaxed text-office-muted">{children}</div>
    </section>
  );
}

/* ---- 콜아웃 (강조 노트) ---- */

export interface CalloutProps {
  readonly tone?: 'note' | 'warn';
  readonly title: string;
  readonly children: ReactNode;
}

export function Callout({ tone = 'note', title, children }: Readonly<CalloutProps>) {
  const accent = tone === 'warn' ? 'border-status-idle/40 bg-status-idle/5' : 'border-dk-harness-orange/30 bg-dk-harness-orange/5';
  const label = tone === 'warn' ? 'text-status-idle' : 'text-dk-harness-orange';
  return (
    <div className={['my-5 rounded-xl border px-5 py-4', accent].join(' ')}>
      <p className={['m-0 mb-1.5 font-mono text-[11px] font-bold uppercase tracking-widest', label].join(' ')}>{title}</p>
      <div className="text-sm leading-relaxed text-office-text/80">{children}</div>
    </div>
  );
}

/* ---- 코드 블록 ---- */

export interface CodeBlockProps {
  readonly children: string;
}

export function CodeBlock({ children }: Readonly<CodeBlockProps>) {
  return (
    <pre className="my-4 overflow-x-auto rounded-xl border border-office-border bg-office-surface px-5 py-4 font-mono text-[13px] leading-relaxed text-office-text">
      <code>{children}</code>
    </pre>
  );
}
