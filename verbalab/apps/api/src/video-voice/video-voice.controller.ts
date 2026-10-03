import { Controller, Get, UseGuards } from '@nestjs/common';
import { VideoVoiceService } from './video-voice.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/video-voice')
export class VideoVoiceController {
  constructor(private readonly service: VideoVoiceService) {}

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
