import { randomUUID } from 'crypto';
import type { ApprovalRequest } from '@/types/session';

class ApprovalRegistry {
  private approvals: Map<string, ApprovalRequest> = new Map();

  create(
    req: Omit<ApprovalRequest, 'id' | 'status' | 'createdAt'>,
  ): ApprovalRequest {
    const approval: ApprovalRequest = {
      ...req,
      id: randomUUID(),
      status: 'pending',
      createdAt: Date.now(),
    };
    this.approvals.set(approval.id, approval);
    return approval;
  }

  decide(
    id: string,
    decision: 'approved' | 'denied',
    reason?: string,
    decidedBy?: string,
  ): ApprovalRequest {
    const approval = this.approvals.get(id);
    if (!approval) {
      throw new Error(`Approval not found: ${id}`);
    }
    if (approval.status !== 'pending') {
      throw new Error(`Approval already decided: ${id}`);
    }
    const updated: ApprovalRequest = {
      ...approval,
      status: decision,
      decidedAt: Date.now(),
      decidedBy,
      reason,
    };
    this.approvals.set(id, updated);
    return updated;
  }

  getPending(): ApprovalRequest[] {
    return Array.from(this.approvals.values()).filter(
      (a) => a.status === 'pending',
    );
  }

  getAll(): ApprovalRequest[] {
    return Array.from(this.approvals.values());
  }

  get(id: string): ApprovalRequest | undefined {
    return this.approvals.get(id);
  }

  cleanup(maxAgeMs: number): void {
    const cutoff = Date.now() - maxAgeMs;
    for (const [id, approval] of this.approvals) {
      if (approval.createdAt < cutoff) {
        this.approvals.delete(id);
      }
    }
  }
}

// Singleton pattern with global persistence across HMR
const globalForApprovals = globalThis as typeof globalThis & {
  __approvalRegistry?: ApprovalRegistry;
};

if (!globalForApprovals.__approvalRegistry) {
  globalForApprovals.__approvalRegistry = new ApprovalRegistry();
}

export const approvalRegistry: ApprovalRegistry =
  globalForApprovals.__approvalRegistry;

// Auto-cleanup every hour
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const MAX_AGE_MS = 60 * 60 * 1000;

if (typeof globalThis !== 'undefined') {
  const g = globalThis as typeof globalThis & {
    __approvalCleanupTimer?: ReturnType<typeof setInterval>;
  };
  if (!g.__approvalCleanupTimer) {
    g.__approvalCleanupTimer = setInterval(() => {
      approvalRegistry.cleanup(MAX_AGE_MS);
    }, CLEANUP_INTERVAL_MS);
  }
}
