
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CivicVoiceEvidenceService } from './civic-voice-evidence.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/civic-voice-evidence')
export class CivicVoiceEvidenceController {
  constructor(private readonly service: CivicVoiceEvidenceService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }

  @Get('chain')
  @UseGuards(ClerkAuthGuard)
  chain(@CurrentSession() session: SessionContext) {
    return this.service.listChain(session.organizationId);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  get(@CurrentSession() session: SessionContext, @Param('id') id: string) {
    return this.service.get(session.organizationId, id);
  }

  @Post('append')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  append(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.append(session, body ?? {}, clientIp(req));
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  verify(@CurrentSession() session: SessionContext) {
    return this.service.verify(session.organizationId);
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  exportPkg(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: Record<string, unknown>,
  ) {
    return this.service.exportPackage(session, body ?? {}, clientIp(req));
  }
}
