'use client';

import { useEffect, useRef } from 'react';
import type { AgentEvent } from '@/types/session';

const SSE_URL = '/api/relay/events';
const RECONNECT_DELAY_MS = 3000;

export function useSessionEvents(onEvent: (event: AgentEvent) => void): void {
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    function connect(): void {
      es = new EventSource(SSE_URL);

      es.onmessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data as string) as AgentEvent | { type: string };
          // Skip heartbeat messages
          if ('type' in data && (data as { type: string }).type === 'connected') return;
          onEventRef.current(data as AgentEvent);
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        es?.close();
        es = null;
        if (!destroyed) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      if (reconnectTimer !== null) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, []);
}
