import type { Action, Direction } from './SpriteLoader';

export type CharacterState = 'idle' | 'walking' | 'typing' | 'reading';

// AgentState.status → CharacterState 매핑
export function agentStatusToCharacterState(
  status: 'idle' | 'working' | 'reviewing' | 'blocked'
): CharacterState {
  switch (status) {
    case 'working':
      return 'typing';
    case 'reviewing':
      return 'reading';
    case 'blocked':
      return 'idle';
    case 'idle':
    default:
      return 'walking'; // idle 에이전트는 걸어다님
  }
}

export interface AnimConfig {
  action: Action;
  /** 프레임당 시간 (초) */
  frameDuration: number;
  direction: Direction;
}

const STATE_ANIM: Record<CharacterState, AnimConfig> = {
  idle:    { action: 'walk',  frameDuration: 999,  direction: 'down' },
  walking: { action: 'walk',  frameDuration: 0.15, direction: 'down' },
  typing:  { action: 'type',  frameDuration: 0.3,  direction: 'down' },
  reading: { action: 'read',  frameDuration: 0.4,  direction: 'down' },
};

export interface FSMState {
  characterState: CharacterState;
  frameIndex: number;
  elapsed: number;
}

export function createFSMState(initial: CharacterState = 'idle'): FSMState {
  return { characterState: initial, frameIndex: 1, elapsed: 0 }; // walk2 = index 1 (정지 포즈)
}

/**
 * FSM 틱 — deltaTime(초) 만큼 시간 전진, 새 FSMState 반환
 * idle 상태는 walk2 프레임(index 1)에 고정
 */
export function tickFSM(
  state: FSMState,
  deltaTime: number,
  frameCount: (action: Action) => number
): FSMState {
  const { characterState } = state;
  const config = STATE_ANIM[characterState];

  // idle은 고정 포즈
  if (characterState === 'idle') {
    return { ...state, frameIndex: 1, elapsed: 0 };
  }

  const elapsed = state.elapsed + deltaTime;
  if (elapsed >= config.frameDuration) {
    const total = frameCount(config.action);
    const nextFrame = (state.frameIndex + 1) % total;
    return { characterState, frameIndex: nextFrame, elapsed: elapsed - config.frameDuration };
  }

  return { ...state, elapsed };
}

export function getAnimConfig(state: CharacterState): AnimConfig {
  return STATE_ANIM[state];
}
