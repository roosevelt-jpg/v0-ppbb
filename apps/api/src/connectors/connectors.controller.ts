import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ConnectorsService } from './connectors.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/connectors')
export class ConnectorsController {
  constructor(private readonly connectors: ConnectorsService) {}

  @Get()
  list() {
    return this.connectors.listTypes();
  }

  @Get('installations')
  @UseGuards(ClerkAuthGuard)
  listInstallations(
    @CurrentSession() session: SessionContext,
    @Query('type') type?: string,
  ) {
    return this.connectors.listInstallations(session.organizationId, type);
  }

  @Post(':type/install')
  @UseGuards(ClerkAuthGuard)
  install(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Param('type') type: string,
    @Body()
    body: { label?: string; config?: Record<string, unknown> },
  ) {
    return this.connectors.install({
      type,
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      label: body?.label,
      config: body?.config,
      ip: clientIp(req),
    });
  }

  @Post('teams/commands')
  @UseGuards(ClerkAuthGuard)
  teamsCommands(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body()
    body: { text?: string; source?: string; target?: string; installationId?: string },
  ) {
    return this.connectors.invoke({
      type: 'teams',
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      installationId: body?.installationId,
      payload: {
        text: body?.text,
        source: body?.source ?? 'auto',
        target: body?.target ?? 'en',
        command: 'translate',
      },
      ip: clientIp(req),
    });
  }

  @Post(':type/invoke')
  @UseGuards(ClerkAuthGuard)
  invoke(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Param('type') type: string,
    @Body()
    body: { installationId?: string; payload?: Record<string, unknown> },
  ) {
    return this.connectors.invoke({
      type,
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      installationId: body?.installationId,
      payload: body?.payload,
      ip: clientIp(req),
    });
  }
}
