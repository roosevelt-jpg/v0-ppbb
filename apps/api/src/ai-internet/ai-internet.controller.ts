import { Controller, Get, UseGuards } from '@nestjs/common';
import { AiInternetService } from './ai-internet.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/ai-internet')
export class AiInternetController {
  constructor(private readonly service: AiInternetService) {}

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
