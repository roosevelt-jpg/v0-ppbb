import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import {
  AGENT_DENIED_ACTIONS,
  AGENT_PERMISSIONS,
  AgentPermission,
} from './agent-runtime.catalog';

/**
 * Local hard gate used by Agent Runtime (VL-219).
 * Full Policy Runtime (VL-222) will replace/extend this — Agent must not wait to deny.
 */
@Injectable()
export class AgentPolicyGate {
  /**
   * Hard-deny if action is globally forbidden or not in the agent's allowlist.
   * Returns a structured allow result for audit.
   */
  assertAllowed(input: {
    agentId: string;
    action: string;
    permissions: string[];
  }): { allowed: true; action: AgentPermission; policy: 'local_allowlist' } {
    const action = (input.action ?? '').trim();
    if (!action) {
      throw new ApiException(
        'agent_policy_denied',
        'action is required',
        HttpStatus.FORBIDDEN,
      );
    }

    if ((AGENT_DENIED_ACTIONS as readonly string[]).includes(action)) {
      throw new ApiException(
        'agent_policy_denied',
        `Action "${action}" is globally forbidden in Agent Runtime sandbox (hard gate).`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (!(AGENT_PERMISSIONS as readonly string[]).includes(action)) {
      throw new ApiException(
        'agent_policy_denied',
        `Action "${action}" is not a grantable Agent Runtime permission.`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (!input.permissions.includes(action)) {
      throw new ApiException(
        'agent_policy_denied',
        `Agent ${input.agentId} lacks permission "${action}" (hard allowlist gate).`,
        HttpStatus.FORBIDDEN,
      );
    }

    return {
      allowed: true,
      action: action as AgentPermission,
      policy: 'local_allowlist',
    };
  }

  normalizePermissions(raw: string[] | undefined): AgentPermission[] {
    const list = Array.isArray(raw) ? raw : [];
    const out: AgentPermission[] = [];
    for (const p of list) {
      const id = String(p).trim();
      if ((AGENT_PERMISSIONS as readonly string[]).includes(id) && !out.includes(id as AgentPermission)) {
        out.push(id as AgentPermission);
      }
    }
    if (out.length === 0) {
      // Safe default: plan + memory search only
      return ['reason.plan', 'memory.search'];
    }
    return out;
  }
}
