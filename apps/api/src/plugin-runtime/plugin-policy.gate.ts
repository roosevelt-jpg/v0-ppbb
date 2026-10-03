import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api-exception';
import {
  PLUGIN_DENIED_ACTIONS,
  PLUGIN_PERMISSIONS,
  PluginPermission,
} from './plugin-runtime.catalog';

/**
 * Local hard gate used by Plugin Runtime (VL-221).
 * Full Policy Runtime (VL-222) will replace/extend this — Plugin must not wait to deny.
 */
@Injectable()
export class PluginPolicyGate {
  assertAllowed(input: {
    pluginId: string;
    action: string;
    permissions: string[];
  }): { allowed: true; action: PluginPermission; policy: 'local_allowlist' } {
    const action = (input.action ?? '').trim();
    if (!action) {
      throw new ApiException(
        'plugin_policy_denied',
        'action is required',
        HttpStatus.FORBIDDEN,
      );
    }

    if ((PLUGIN_DENIED_ACTIONS as readonly string[]).includes(action)) {
      throw new ApiException(
        'plugin_policy_denied',
        `Action "${action}" is globally forbidden in Plugin Runtime sandbox (hard gate).`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (!(PLUGIN_PERMISSIONS as readonly string[]).includes(action)) {
      throw new ApiException(
        'plugin_policy_denied',
        `Action "${action}" is not a grantable Plugin Runtime permission.`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (!input.permissions.includes(action)) {
      throw new ApiException(
        'plugin_policy_denied',
        `Plugin ${input.pluginId} lacks permission "${action}" (hard allowlist gate).`,
        HttpStatus.FORBIDDEN,
      );
    }

    return {
      allowed: true,
      action: action as PluginPermission,
      policy: 'local_allowlist',
    };
  }

  normalizePermissions(raw: string[] | undefined): PluginPermission[] {
    const list = Array.isArray(raw) ? raw : [];
    const out: PluginPermission[] = [];
    for (const p of list) {
      const id = String(p).trim();
      if (
        (PLUGIN_PERMISSIONS as readonly string[]).includes(id) &&
        !out.includes(id as PluginPermission)
      ) {
        out.push(id as PluginPermission);
      }
    }
    if (out.length === 0) {
      return ['plugin.read', 'memory.search'];
    }
    return out;
  }
}
