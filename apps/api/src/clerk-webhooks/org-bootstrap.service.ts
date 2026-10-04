import { Injectable, Logger } from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WebhookService } from '../jobs/webhook.service';
import { planFromId } from '../billing/plans';

@Injectable()
export class OrgBootstrapService {
  private readonly logger = new Logger(OrgBootstrapService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeys: ApiKeysService,
    private readonly notifications: NotificationsService,
    private readonly webhooks: WebhookService,
  ) {}

  /**
   * Ensure org + default workspace + Free credits + first test API key + welcome email.
   * Idempotent for repeated Clerk webhook / session bootstrap calls.
   */
  async bootstrapOrganization(input: {
    clerkOrgId?: string | null;
    orgName: string;
    clerkUserId: string;
    email?: string;
    name?: string;
    role?: MembershipRole;
    source: 'clerk_webhook' | 'session';
  }) {
    const user = await this.prisma.user.upsert({
      where: { clerkUserId: input.clerkUserId },
      create: {
        clerkUserId: input.clerkUserId,
        email: input.email,
        name: input.name,
      },
      update: {
        email: input.email,
        name: input.name,
      },
    });

    let organization =
      input.clerkOrgId != null
        ? await this.prisma.organization.findUnique({ where: { clerkOrgId: input.clerkOrgId } })
        : null;

    let created = false;
    if (!organization && input.clerkOrgId) {
      const plan = planFromId('free');
      organization = await this.prisma.organization.create({
        data: {
          clerkOrgId: input.clerkOrgId,
          name: input.orgName,
          plan: plan.id,
          characterQuota: plan.characterQuota,
          dataRegion: 'af',
          memberships: {
            create: { userId: user.id, role: input.role ?? MembershipRole.owner },
          },
          workspaces: {
            create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
          },
        },
      });
      created = true;
    }

    if (!organization) {
      const membership = await this.prisma.membership.findFirst({
        where: { userId: user.id },
        include: { organization: true },
        orderBy: { createdAt: 'asc' },
      });
      if (membership) {
        organization = membership.organization;
      } else {
        const plan = planFromId('free');
        organization = await this.prisma.organization.create({
          data: {
            name: input.orgName,
            plan: plan.id,
            characterQuota: plan.characterQuota,
            dataRegion: 'af',
            memberships: {
              create: { userId: user.id, role: MembershipRole.owner },
            },
            workspaces: {
              create: { name: 'Default', defaultSourceLang: 'en', defaultTargetLang: 'sw' },
            },
          },
        });
        created = true;
      }
    } else {
      await this.prisma.membership.upsert({
        where: {
          organizationId_userId: { organizationId: organization.id, userId: user.id },
        },
        create: {
          organizationId: organization.id,
          userId: user.id,
          role: input.role ?? MembershipRole.member,
        },
        update: input.role ? { role: input.role } : {},
      });
    }

    const workspace = await this.prisma.workspace.findFirst({
      where: { organizationId: organization.id },
      orderBy: { createdAt: 'asc' },
    });
    if (!workspace) {
      throw new Error('Bootstrap failed: workspace missing');
    }

    const existingKeys = await this.prisma.apiKey.count({
      where: { organizationId: organization.id, revokedAt: null },
    });

    let firstApiKey: { id: string; prefix: string; secret?: string; environment: string } | null =
      null;
    if (existingKeys === 0) {
      const minted = await this.apiKeys.create({
        organizationId: organization.id,
        workspaceId: workspace.id,
        userId: user.id,
        name: 'Default test key',
        environment: 'test',
      });
      firstApiKey = {
        id: minted.id,
        prefix: minted.prefix,
        secret: minted.secret,
        environment: minted.environment,
      };
    }

    if (input.email && (created || firstApiKey)) {
      void this.notifications.notifyWelcome({
        organizationId: organization.id,
        organizationName: organization.name,
        email: input.email,
        name: input.name,
        apiKeyPrefix: firstApiKey?.prefix,
        apiKeySecret: firstApiKey?.secret,
        monthlyCredits: organization.characterQuota,
      });
    }

    if (organization.partnerWebhookUrl && created) {
      void this.webhooks
        .deliver({
          organizationId: organization.id,
          webhookUrl: organization.partnerWebhookUrl,
          event: 'organization.bootstrapped',
          data: {
            organizationId: organization.id,
            name: organization.name,
            plan: organization.plan,
            characterQuota: organization.characterQuota,
            workspaceId: workspace.id,
            source: input.source,
            firstApiKeyPrefix: firstApiKey?.prefix ?? null,
          },
        })
        .catch((err) =>
          this.logger.warn(
            `Bootstrap webhook failed: ${err instanceof Error ? err.message : err}`,
          ),
        );
    }

    return {
      organizationId: organization.id,
      workspaceId: workspace.id,
      created,
      firstApiKey: firstApiKey
        ? {
            id: firstApiKey.id,
            prefix: firstApiKey.prefix,
            environment: firstApiKey.environment,
            // Secret only returned once at mint time to webhook/email path — not re-exposed later.
            secret: firstApiKey.secret,
          }
        : null,
      characterQuota: organization.characterQuota,
      plan: organization.plan,
    };
  }
}
