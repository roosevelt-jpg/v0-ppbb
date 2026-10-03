import { Module } from '@nestjs/common';
import { VideoVoiceController } from './video-voice.controller';
import { VideoVoiceService } from './video-voice.service';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [IdentityModule],
  controllers: [VideoVoiceController],
  providers: [VideoVoiceService],
  exports: [VideoVoiceService],
})
export class VideoVoiceModule {}
