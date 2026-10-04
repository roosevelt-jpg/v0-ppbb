import { Controller, Get, UseGuards } from '@nestjs/common';
import { AiObservabilityService } from './ai-observability.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/ai-observability')
export class AiObservabilityController {
  constructor(private readonly service: AiObservabilityService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('dashboard')
  @UseGuards(ClerkAuthGuard)
  dashboard(@CurrentSession() session: SessionContext) {
    return this.service.dashboard(session.organizationId);
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


  @Get('apm')
  @UseGuards(ClerkAuthGuard)
  apm(@CurrentSession() session: SessionContext) {
    return this.service.apm(session.organizationId);
  }
}
