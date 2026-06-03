'use client';

import { useCallback } from 'react';
import { useOfficeStore } from '@/stores/office-store';
import { SEAT_POSITIONS } from '../OfficeLayout';
import { CharacterBillboard } from './CharacterBillboard';
import { AGENT_CONFIG, AGENT_SCREEN_COLORS } from '@/lib/colors';
import type { ChatMessage } from '@/stores/office-store';

export function AgentCharacters() {
  const agents = useOfficeStore((state) => state.agents);
  const sessions = useOfficeStore((state) => state.sessions);
  const selectedAgentId = useOfficeStore((state) => state.selectedAgentId);
  const hoveredAgentId = useOfficeStore((state) => state.hoveredAgentId);
  const selectAgent = useOfficeStore((state) => state.selectAgent);
  const setHoveredAgent = useOfficeStore((state) => state.setHoveredAgent);
  const chatMessages = useOfficeStore((state) => state.chatMessages);

  // 에이전트별 마지막 채팅 메시지 맵 (agentId -> text)
  const lastChatByAgent = chatMessages.reduce<Record<string, string>>((acc, msg: ChatMessage) => {
    acc[msg.agentId.toLowerCase()] = msg.text;
    return acc;
  }, {});

  const handleSelect = useCallback(
    (id: string) => {
      selectAgent(selectedAgentId === id ? null : id);
    },
    [selectAgent, selectedAgentId],
  );

  const handleHover = useCallback(
    (id: string | null) => {
      setHoveredAgent(id);
    },
    [setHoveredAgent],
  );

  return (
    <group>
      {AGENT_CONFIG.map((config) => {
        const seat = SEAT_POSITIONS.find((s) => s.id === config.id);
        if (!seat) return null;

        const agentState = agents.get(config.id);
        const agentStatus = agentState?.status ?? 'idle';

        const session = Array.from(sessions.values()).find(
          (s) => s.agentName.toLowerCase() === config.id.toLowerCase(),
        );

        return (
          <CharacterBillboard
            key={config.id}
            agentId={config.id}
            position={seat.position}
            name={config.name}
            role={config.role}
            screenColor={AGENT_SCREEN_COLORS[config.id]}
            agentStatus={agentStatus}
            currentTool={session?.currentTool}
            onSelect={handleSelect}
            onHover={handleHover}
            isHovered={hoveredAgentId === config.id}
            isSelected={selectedAgentId === config.id}
            lastChatMessage={lastChatByAgent[config.id.toLowerCase()]}
          />
        );
      })}
    </group>
  );
}
