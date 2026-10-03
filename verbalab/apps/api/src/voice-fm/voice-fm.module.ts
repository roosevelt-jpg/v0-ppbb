import { Module } from '@nestjs/common';
import { VoiceFmController } from './voice-fm.controller';
import { VoiceFmService } from './voice-fm.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [VoiceFmController],
  providers: [VoiceFmService],
  exports: [VoiceFmService],
})
export class VoiceFmModule {}
