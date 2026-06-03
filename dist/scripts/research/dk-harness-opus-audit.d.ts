#!/usr/bin/env node
export type ModelValue = 'opus' | 'sonnet' | 'haiku';
export type Classification = 'JUSTIFIED' | 'DIVERGENT' | 'ORPHAN_OPUS';
export interface AgentSources {
    frontmatter: ModelValue | null;
    agentDefaults: ModelValue | null;
    agentTiers: ModelValue | null;
    orchestrator: ModelValue | null;
    roster: ModelValue | null;
}
export interface AgentRecord {
    name: string;
    sources: AgentSources;
    classification: Classification;
}
export interface AuditReport {
    timestamp: string;
    agents: AgentRecord[];
    deadRefCount: number;
    deadRefTotal: number;
}
export declare function parseFrontmatterModel(content: string): ModelValue | null;
export declare function parseAgentDefaults(source: string): Record<string, ModelValue>;
export declare function parseAgentTiers(source: string): Record<string, ModelValue>;
export declare function parseOrchestratorHardcoded(source: string): Record<string, ModelValue>;
export declare function parseRosterFromClaudeMd(content: string): Record<string, ModelValue>;
export declare function classifyAgent(s: AgentSources): Classification;
export declare function formatAuditMarkdown(report: AuditReport): string;
export declare function main(repoRoot: string): string;
//# sourceMappingURL=dk-harness-opus-audit.d.ts.map