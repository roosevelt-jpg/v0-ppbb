import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';

@Controller('v1/notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('engine')
  engine() {
    return this.notifications.engine();
  }

  @Get('templates')
  templates() {
    return this.notifications.templates();
  }

  @Get('templates/:id/preview')
  preview(@Param('id') id: string) {
    return this.notifications.previewTemplate(id);
  }

  @Get('monitoring')
  monitoring() {
    const engine = this.notifications.engine();
    return {
      status: engine.configured && !engine.disabled ? 'ready' : 'awaiting_credentials',
      configured: engine.configured,
      disabled: engine.disabled,
      provider: engine.provider,
    };
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: this.notifications.engine(),
      templates: this.notifications.templates(),
      links: {
        self: '/notifications',
        docs: '/docs/NOTIFICATIONS.md',
        credentials: '/credentials-readiness',
      },
    };
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  test(
    @CurrentSession() session: SessionContext,
    @Body() body: { to?: string; templateId?: string },
  ) {
    if (session.role !== 'owner' && session.role !== 'admin') {
      throw new ApiException('forbidden', 'Owner or admin required', HttpStatus.FORBIDDEN);
    }
    const to = body.to?.trim();
    if (!to) {
      throw new ApiException('validation_error', 'to is required', HttpStatus.BAD_REQUEST);
    }
    return this.notifications.sendTestEmail({
      organizationId: session.organizationId,
      userId: session.userId,
      to,
      templateId: body.templateId,
    });
  }
}
