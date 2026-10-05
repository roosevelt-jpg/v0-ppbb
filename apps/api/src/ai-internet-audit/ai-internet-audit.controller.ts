import { Controller, Get, UseGuards } from '@nestjs/common';
import { AiInternetAuditService } from './ai-internet-audit.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/ai-internet-audit')
export class AiInternetAuditController {
  constructor(private readonly service: AiInternetAuditService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }
}
