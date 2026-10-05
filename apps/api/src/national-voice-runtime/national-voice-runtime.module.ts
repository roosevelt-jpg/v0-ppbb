
import { Module } from '@nestjs/common';
import { NationalVoiceRuntimeController } from './national-voice-runtime.controller';
import { NationalVoiceRuntimeService } from './national-voice-runtime.service';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, AuditCoreModule],
  controllers: [NationalVoiceRuntimeController],
  providers: [NationalVoiceRuntimeService],
  exports: [NationalVoiceRuntimeService],
})
export class NationalVoiceRuntimeModule {}
