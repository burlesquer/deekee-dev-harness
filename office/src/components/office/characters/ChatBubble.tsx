'use client';

import { useEffect, useRef, useState } from 'react';
import { Html } from '@react-three/drei';

interface ChatBubbleProps {
  text: string;
  screenColor?: string;
}

export function ChatBubble({ text, screenColor = '#FF6B2C' }: Readonly<ChatBubbleProps>) {
  const [opacity, setOpacity] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setOpacity(1);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setOpacity(0);
    }, 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text]);

  const truncated = text.length > 50 ? text.slice(0, 47) + '...' : text;

  return (
    <Html
      position={[0, 0.95, 0.01]}
      center
      distanceFactor={6}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          opacity,
          transition: 'opacity 0.4s ease',
          background: '#12121e',
          border: `2px solid ${screenColor}`,
          borderRadius: 0,
          padding: '4px 8px',
          color: '#e0e0f0',
          fontFamily: 'monospace',
          fontSize: '11px',
          whiteSpace: 'nowrap',
          maxWidth: '160px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          boxShadow: `0 0 6px ${screenColor}44`,
          // pixel art sharp look
          imageRendering: 'pixelated',
        }}
      >
        {truncated}
        {/* 말풍선 꼬리 */}
        <div
          style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: `8px solid ${screenColor}`,
          }}
        />
      </div>
    </Html>
  );
}
