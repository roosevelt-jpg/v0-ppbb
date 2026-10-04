import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AgentOperatingSystemService } from './agent-operating-system.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/agent-os')
export class AgentOsController {
  constructor(private readonly service: AgentOperatingSystemService) {}

  @Get('engine')
  engine() {
    return this.service.agentOsEngine();
  }

  @Post('run')
  @UseGuards(ClerkAuthGuard)
  run(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body()
    body: {
      goal?: string;
      capability?: string;
      agentId?: string;
      pipeline?: string;
      text?: string;
      actions?: Array<{ action: string; input?: Record<string, unknown> }>;
    },
  ) {
    return this.service.runAgentOs({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      goal: body?.goal ?? body?.text,
      capability: body?.capability,
      agentId: body?.agentId,
      pipeline: body?.pipeline,
      actions: body?.actions,
      ip: clientIp(req),
    });
  }
}
