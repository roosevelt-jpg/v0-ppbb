import { Body, Controller, Get, HttpStatus, Put, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiException } from '../common/errors/api-exception';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../jobs/webhook.service';

@Controller('v1/partner-webhooks')
@UseGuards(ClerkAuthGuard)
export class PartnerWebhooksController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooks: WebhookService,
  ) {}

  @Get()
  async get(@Req() req: Request & { sessionAuth: SessionContext }) {
    this.assertAdmin(req.sessionAuth);
    const org = await this.prisma.organization.findUniqueOrThrow({
      where: { id: req.sessionAuth.organizationId },
      select: { partnerWebhookUrl: true, webhookSigningSecret: true },
    });
    return {
      partnerWebhookUrl: org.partnerWebhookUrl,
      hasSigningSecret: Boolean(org.webhookSigningSecret),
      events: [
        'organization.bootstrapped',
        'job.succeeded',
        'job.failed',
        'credits.low',
        'api_key.revoked',
      ],
      docs: '/docs/PARTNER_WEBHOOKS.md',
    };
  }

  @Put()
  async set(
    @Req() req: Request & { sessionAuth: SessionContext },
    @Body() body: { partnerWebhookUrl?: string | null },
  ) {
    this.assertAdmin(req.sessionAuth);
    const url = body.partnerWebhookUrl?.trim() || null;
    if (url && !/^https:\/\//i.test(url)) {
      throw new ApiException(
        'validation_error',
        'partnerWebhookUrl must be https',
        HttpStatus.BAD_REQUEST,
      );
    }
    const org = await this.prisma.organization.update({
      where: { id: req.sessionAuth.organizationId },
      data: { partnerWebhookUrl: url },
      select: { partnerWebhookUrl: true },
    });
    await this.webhooks.ensureSigningSecret(req.sessionAuth.organizationId);
    return { partnerWebhookUrl: org.partnerWebhookUrl };
  }

  private assertAdmin(session: SessionContext) {
    if (session.role !== 'owner' && session.role !== 'admin') {
      throw new ApiException('forbidden', 'Owner or admin required', HttpStatus.FORBIDDEN);
    }
  }
}
