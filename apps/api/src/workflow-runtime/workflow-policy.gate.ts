import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import {
  WORKFLOW_DENIED_ACTIONS,
  WORKFLOW_PERMISSIONS,
  WorkflowPermission,
} from './workflow-runtime.catalog';

/**
 * Local hard gate used by Workflow Runtime (VL-220).
 * Full Policy Runtime (VL-222) will replace/extend this — Workflow must not wait to deny.
 */
@Injectable()
export class WorkflowPolicyGate {
  assertAllowed(input: {
    workflowId: string;
    action: string;
    permissions: string[];
  }): { allowed: true; action: WorkflowPermission; policy: 'local_allowlist' } {
    const action = (input.action ?? '').trim();
    if (!action) {
      throw new ApiException(
        'workflow_policy_denied',
        'action is required',
        HttpStatus.FORBIDDEN,
      );
    }

    if ((WORKFLOW_DENIED_ACTIONS as readonly string[]).includes(action)) {
      throw new ApiException(
        'workflow_policy_denied',
        `Action "${action}" is globally forbidden in Workflow Runtime sandbox (hard gate).`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (!(WORKFLOW_PERMISSIONS as readonly string[]).includes(action)) {
      throw new ApiException(
        'workflow_policy_denied',
        `Action "${action}" is not a grantable Workflow Runtime permission.`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (!input.permissions.includes(action)) {
      throw new ApiException(
        'workflow_policy_denied',
        `Workflow ${input.workflowId} lacks permission "${action}" (hard allowlist gate).`,
        HttpStatus.FORBIDDEN,
      );
    }

    return {
      allowed: true,
      action: action as WorkflowPermission,
      policy: 'local_allowlist',
    };
  }

  normalizePermissions(raw: string[] | undefined): WorkflowPermission[] {
    const list = Array.isArray(raw) ? raw : [];
    const out: WorkflowPermission[] = [];
    for (const p of list) {
      const id = String(p).trim();
      if (
        (WORKFLOW_PERMISSIONS as readonly string[]).includes(id) &&
        !out.includes(id as WorkflowPermission)
      ) {
        out.push(id as WorkflowPermission);
      }
    }
    if (out.length === 0) {
      return ['reason.plan', 'memory.search'];
    }
    return out;
  }
}
