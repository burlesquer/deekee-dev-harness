'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { TerminalInput } from './TerminalInput';
import type { AgentEvent } from '@/types/session';
import { useOfficeStore } from '@/stores/office-store';

interface TerminalPanelProps {
  agentId: string;
  onClose: () => void;
  events: AgentEvent[];
}

const PANEL_MIN_HEIGHT = 160;
const PANEL_DEFAULT_HEIGHT = 260;

// ANSI color helpers
const ANSI = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

function fmtToolStart(toolName: string): string {
  return `${ANSI.cyan}▶ ${ANSI.bold}${toolName}${ANSI.reset}${ANSI.gray} started${ANSI.reset}\r\n`;
}

function fmtToolDone(toolName: string): string {
  return `${ANSI.green}✓ ${ANSI.bold}${toolName}${ANSI.reset}${ANSI.green} completed${ANSI.reset}\r\n`;
}

function fmtStatusChange(status: string): string {
  return `${ANSI.yellow}● status → ${ANSI.bold}${status}${ANSI.reset}\r\n`;
}

function fmtRegister(agentName: string): string {
  return `${ANSI.gray}[connected] ${agentName}${ANSI.reset}\r\n`;
}

function fmtUnregister(agentName: string): string {
  return `${ANSI.gray}[disconnected] ${agentName}${ANSI.reset}\r\n`;
}

export function TerminalPanel({ agentId, onClose, events }: Readonly<TerminalPanelProps>) {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<InstanceType<typeof import('@xterm/xterm').Terminal> | null>(null);
  const [height, setHeight] = useState(PANEL_DEFAULT_HEIGHT);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartH = useRef(0);
  const sessions = useOfficeStore((s) => s.sessions);
  const processedCountRef = useRef(0);

  // Find session matching this agentId
  const session = Array.from(sessions.values()).find(
    (s) => s.sessionId === agentId || s.agentName.toLowerCase() === agentId.toLowerCase(),
  );

  // Write helper — stable ref so effects don't re-register on every write
  const writeRef = useRef<(text: string) => void>(() => {});

  // Boot xterm once on mount
  useEffect(() => {
    if (!termRef.current) return;

    let term: import('@xterm/xterm').Terminal;
    let fitAddon: import('@xterm/addon-fit').FitAddon;
    let destroyed = false;

    (async () => {
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      await import('@xterm/xterm/css/xterm.css');

      if (destroyed || !termRef.current) return;

      term = new Terminal({
        theme: {
          background: '#0a0a0f',
          foreground: '#e0e0e0',
          cursor: '#4a9eff',
          selectionBackground: '#1e3a5f',
          black: '#0a0a0f',
          brightBlack: '#333355',
        },
        fontFamily: 'Geist Mono, "Cascadia Code", "Fira Code", monospace',
        fontSize: 12,
        lineHeight: 1.4,
        cursorBlink: false,
        scrollback: 500,
        convertEol: true,
        disableStdin: true,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(termRef.current);
      fitAddon.fit();

      xtermRef.current = term;
      writeRef.current = (text: string) => {
        if (!destroyed) term.write(text);
      };

      term.write(`${ANSI.gray}── Terminal: ${agentId} ──${ANSI.reset}\r\n`);
    })();

    const ro = new ResizeObserver(() => {
      try { fitAddon?.fit(); } catch { /* ignore */ }
    });
    if (termRef.current) ro.observe(termRef.current);

    return () => {
      destroyed = true;
      ro.disconnect();
      term?.dispose();
      xtermRef.current = null;
    };
  // agentId intentionally omitted — only mount once; header is written once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Process incoming events from props (filtered by page.tsx)
  useEffect(() => {
    const newEvents = events.slice(processedCountRef.current);
    if (newEvents.length === 0) return;
    processedCountRef.current = events.length;

    for (const event of newEvents) {
      switch (event.eventType) {
        case 'tool_start':
          writeRef.current(fmtToolStart(event.toolName ?? 'unknown'));
          break;
        case 'tool_done':
          writeRef.current(fmtToolDone(event.toolName ?? 'unknown'));
          break;
        case 'status_change': {
          const status = (event.payload?.status as string) ?? 'unknown';
          writeRef.current(fmtStatusChange(status));
          break;
        }
        case 'register':
          writeRef.current(fmtRegister(event.agentName));
          break;
        case 'unregister':
          writeRef.current(fmtUnregister(event.agentName));
          break;
        default:
          break;
      }
    }
  }, [events]);

  // Drag-to-resize handlers
  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    dragStartY.current = e.clientY;
    dragStartH.current = height;
  }, [height]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const delta = dragStartY.current - e.clientY;
      setHeight(Math.max(PANEL_MIN_HEIGHT, dragStartH.current + delta));
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  return (
    <div
      style={{
        height,
        background: '#0a0a0f',
        borderTop: '1px solid #1e1e3a',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
        userSelect: dragging ? 'none' : 'auto',
      }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={onDragStart}
        style={{
          height: 5,
          background: '#1e1e3a',
          cursor: 'ns-resize',
          flexShrink: 0,
        }}
      />

      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '3px 10px',
          background: '#0f0f17',
          borderBottom: '1px solid #1e1e3a',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: 'Geist Mono, monospace',
              fontSize: 11,
              color: '#4a9eff',
              fontWeight: 700,
            }}
          >
            RC Terminal
          </span>
          <span
            style={{
              fontFamily: 'Geist Mono, monospace',
              fontSize: 11,
              color: '#5050a0',
            }}
          >
            {agentId}
          </span>
          {session && (
            <span
              style={{
                fontFamily: 'Geist Mono, monospace',
                fontSize: 9,
                color: '#333355',
              }}
            >
              [{session.agentRole}]
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label="Close terminal panel"
          style={{
            background: 'transparent',
            border: '1px solid #2a2a4a',
            borderRadius: 0,
            color: '#7070a0',
            cursor: 'pointer',
            fontSize: 11,
            padding: '1px 6px',
            fontFamily: 'Geist Mono, monospace',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* xterm output */}
      <div
        ref={termRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: '4px 2px 0',
        }}
      />

      {/* Input area */}
      <TerminalInput
        agentId={agentId}
        sessionId={session?.sessionId}
        disabled={!session || session.status === 'completed'}
      />
    </div>
  );
}
