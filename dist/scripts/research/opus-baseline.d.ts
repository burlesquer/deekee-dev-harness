#!/usr/bin/env node
import { type ModelTier } from '../routing/model-router.js';
export interface ParsedEvent {
    agent_type: string;
    duration_ms: number;
}
export interface AgentCost {
    agent: string;
    tier: ModelTier;
    calls: number;
    totalDurationMs: number;
    costProxy: number;
}
export declare function normalizeAgentName(name: string): string;
export declare function tierForAgent(normalized: string): ModelTier;
export declare function parseReplayLines(lines: string[]): ParsedEvent[];
export declare function aggregateByAgent(events: ParsedEvent[]): Map<string, AgentCost>;
interface FormatMeta {
    measuredAt: string;
    sourceFiles: string[];
    totalCalls: number;
}
export declare function formatRankingMarkdown(map: Map<string, AgentCost>, meta: FormatMeta): string;
export declare function main(repoRoot?: string): string;
export {};
//# sourceMappingURL=opus-baseline.d.ts.map