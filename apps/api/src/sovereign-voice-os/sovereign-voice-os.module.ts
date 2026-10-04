
import { Module } from '@nestjs/common';
import { SovereignVoiceOsController } from './sovereign-voice-os.controller';
import { SovereignVoiceOsService } from './sovereign-voice-os.service';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, AuditCoreModule],
  controllers: [SovereignVoiceOsController],
  providers: [SovereignVoiceOsService],
  exports: [SovereignVoiceOsService],
})
export class SovereignVoiceOsModule {}
