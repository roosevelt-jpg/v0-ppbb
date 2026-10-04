import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SpeechDepthService } from './speech-depth.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/speech-depth')
export class SpeechDepthController {
  constructor(private readonly service: SpeechDepthService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }

  @Post('streams')
  @UseGuards(ClerkAuthGuard)
  startStream(
    @CurrentSession() session: SessionContext,
    @Body() body: { language?: string; dialect?: string },
  ) {
    return this.service.startStream(session, body ?? {});
  }
}
