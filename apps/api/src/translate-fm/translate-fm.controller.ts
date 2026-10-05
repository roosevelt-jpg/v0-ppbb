import { Controller, Get, UseGuards } from '@nestjs/common';
import { TranslateFmService } from './translate-fm.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/translate-fm')
export class TranslateFmController {
  constructor(private readonly service: TranslateFmService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('capabilities')
  capabilities() {
    return this.service.capabilities();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }
}
