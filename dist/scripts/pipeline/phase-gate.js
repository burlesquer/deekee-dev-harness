/**
 * dk-harness Phase Gate v1.0.0
 * Validates phase transition preconditions before allowing pipeline stage changes.
 * Reads team-health.json and agent-trace.json for real-time worker state.
 *
 * @module scripts/pipeline/phase-gate
 */
import { join } from 'node:path';
import { readState } from '../core/state.js';
function getHealthPath(projectDir) {
    return join(projectDir || process.cwd(), '.dk-harness', 'state', 'team-health.json');
}
function getTracePath(projectDir) {
    return join(projectDir || process.cwd(), '.dk-harness', 'state', 'agent-trace.json');
}
/**
 * Verify preconditions for a phase transition.
 *
 * Supported transitions and their rules:
 *   exec   → verify : all workers must be completed or failed
 *   verify → fix    : at least one worker must have failed
 *   fix    → exec   : always allowed (re-execution)
 *
 * Any other transition: allowed with a warning if workers are still active.
 */
export async function checkPhaseGate(fromPhase, toPhase, projectDir) {
    const blockers = [];
    const warnings = [];
    // Read team health
    const healthResult = readState(getHealthPath(projectDir));
    const health = healthResult.ok
        ? healthResult.data
        : { workers: [], healthScore: 100, staleCount: 0, activeCount: 0 };
    // Read agent trace
    const traceResult = readState(getTracePath(projectDir));
    const trace = traceResult.ok
        ? traceResult.data
        : { agents: [], activeCount: 0, totalSpawned: 0 };
    const totalTasks = health.workers.length;
    const completedTasks = health.workers.filter(w => w.status === 'completed' || w.status === 'failed').length;
    const activeWorkers = health.workers.filter(w => w.status === 'active');
    const staleWorkers = health.workers.filter(w => w.status === 'stale');
    const failedWorkers = health.workers.filter(w => w.status === 'failed');
    // Active agents in trace
    const activeTraceAgents = trace.agents.filter(a => a.status === 'active');
    const key = `${fromPhase}→${toPhase}`;
    switch (key) {
        case 'exec→verify':
        case 'team-exec→team-verify': {
            // Require all workers to be terminal
            if (activeWorkers.length > 0) {
                blockers.push(`${activeWorkers.length} worker(s) still active: ${activeWorkers.map(w => w.agentName).join(', ')}`);
            }
            if (staleWorkers.length > 0) {
                blockers.push(`${staleWorkers.length} stale worker(s) detected (no heartbeat >60s): ${staleWorkers.map(w => w.agentName).join(', ')}`);
            }
            if (activeTraceAgents.length > 0) {
                blockers.push(`${activeTraceAgents.length} agent(s) still running in trace`);
            }
            break;
        }
        case 'verify→fix':
        case 'team-verify→team-fix': {
            // Require at least one failure
            if (failedWorkers.length === 0) {
                blockers.push('No failures detected — fix phase is not needed');
            }
            if (activeWorkers.length > 0) {
                warnings.push(`${activeWorkers.length} worker(s) still active when entering fix phase`);
            }
            break;
        }
        case 'fix→exec':
        case 'team-fix→team-exec': {
            // Always allowed — re-execution after fixes
            if (activeWorkers.length > 0) {
                warnings.push(`${activeWorkers.length} worker(s) from previous cycle still active`);
            }
            break;
        }
        default: {
            // Generic: warn if active workers remain
            if (activeWorkers.length > 0) {
                warnings.push(`Transitioning ${fromPhase}→${toPhase} with ${activeWorkers.length} active worker(s) still running`);
            }
        }
    }
    return {
        canTransition: blockers.length === 0,
        blockers,
        warnings,
        completedTasks,
        totalTasks,
    };
}
//# sourceMappingURL=phase-gate.js.map