import { Injectable, Logger } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { verifyWebhook } from '@clerk/backend/webhooks';
import { ApiException } from '../common/errors/api-exception';
import { OrgBootstrapService } from './org-bootstrap.service';
import { mapClerkOrgRole } from '../identity/clerk-roles';

@Injectable()
export class ClerkWebhooksService {
  private readonly logger = new Logger(ClerkWebhooksService.name);

  constructor(private readonly bootstrap: OrgBootstrapService) {}

  async handleRaw(rawBody: Buffer, headers: Record<string, string | string[] | undefined>) {
    const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET?.trim();
    if (!secret) {
      throw new ApiException(
        'misconfigured',
        'CLERK_WEBHOOK_SIGNING_SECRET is not set',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const svixId = header(headers, 'svix-id');
    const svixTimestamp = header(headers, 'svix-timestamp');
    const svixSignature = header(headers, 'svix-signature');
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new ApiException(
        'invalid_webhook',
        'Missing Svix signature headers',
        HttpStatus.BAD_REQUEST,
      );
    }

    let evt: Awaited<ReturnType<typeof verifyWebhook>>;
    try {
      const request = new Request('https://verbalab.local/v1/clerk/webhooks', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        },
        body: rawBody,
      });
      evt = await verifyWebhook(request, { signingSecret: secret });
    } catch (error) {
      this.logger.warn(
        `Clerk webhook verify failed: ${error instanceof Error ? error.message : error}`,
      );
      throw new ApiException('invalid_webhook', 'Invalid Clerk webhook signature', HttpStatus.BAD_REQUEST);
    }

    return this.dispatch(evt.type, evt.data as Record<string, unknown>);
  }

  private async dispatch(type: string, data: Record<string, unknown>) {
    switch (type) {
      case 'user.created': {
        const clerkUserId = String(data.id ?? '');
        const email = primaryEmail(data);
        const name = [data.first_name, data.last_name].filter(Boolean).join(' ').trim() || undefined;
        if (!clerkUserId) {
          return { ok: true, ignored: true, reason: 'missing user id' };
        }
        const result = await this.bootstrap.bootstrapOrganization({
          clerkOrgId: null,
          orgName: `${name ?? email ?? 'Personal'} workspace`,
          clerkUserId,
          email,
          name,
          role: MembershipRole.owner,
          source: 'clerk_webhook',
        });
        return { ok: true, type, ...result, firstApiKeySecret: undefined };
      }
      case 'organization.created': {
        const clerkOrgId = String(data.id ?? '');
        const orgName = String(data.name ?? 'Organization');
        const createdBy = String(
          (data.created_by as string | undefined) ??
            (data.createdBy as string | undefined) ??
            '',
        );
        if (!clerkOrgId || !createdBy) {
          return { ok: true, ignored: true, reason: 'missing org/creator' };
        }
        const result = await this.bootstrap.bootstrapOrganization({
          clerkOrgId,
          orgName,
          clerkUserId: createdBy,
          role: MembershipRole.owner,
          source: 'clerk_webhook',
        });
        return {
          ok: true,
          type,
          organizationId: result.organizationId,
          workspaceId: result.workspaceId,
          created: result.created,
          firstApiKeyPrefix: result.firstApiKey?.prefix ?? null,
        };
      }
      case 'organizationMembership.created': {
        const org = data.organization as Record<string, unknown> | undefined;
        const publicUser = data.public_user_data as Record<string, unknown> | undefined;
        const clerkOrgId = String(org?.id ?? '');
        const clerkUserId = String(publicUser?.user_id ?? data.user_id ?? '');
        const email = typeof publicUser?.identifier === 'string' ? publicUser.identifier : undefined;
        const role = mapClerkOrgRole(String(data.role ?? '')) ?? MembershipRole.member;
        if (!clerkOrgId || !clerkUserId) {
          return { ok: true, ignored: true, reason: 'missing membership fields' };
        }
        const result = await this.bootstrap.bootstrapOrganization({
          clerkOrgId,
          orgName: String(org?.name ?? 'Organization'),
          clerkUserId,
          email,
          name: typeof publicUser?.first_name === 'string' ? publicUser.first_name : undefined,
          role,
          source: 'clerk_webhook',
        });
        return {
          ok: true,
          type,
          organizationId: result.organizationId,
          workspaceId: result.workspaceId,
        };
      }
      default:
        return { ok: true, ignored: true, type };
    }
  }
}

function header(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const raw = headers[name] ?? headers[name.toLowerCase()];
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

function primaryEmail(data: Record<string, unknown>): string | undefined {
  const addresses = data.email_addresses as Array<{ email_address?: string }> | undefined;
  if (Array.isArray(addresses) && addresses[0]?.email_address) return addresses[0].email_address;
  if (typeof data.email_address === 'string') return data.email_address;
  return undefined;
}
