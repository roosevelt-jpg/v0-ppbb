import { Controller, Get, UseGuards } from '@nestjs/common';
import { VisionFmService } from './vision-fm.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/vision-fm')
export class VisionFmController {
  constructor(private readonly service: VisionFmService) {}

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
