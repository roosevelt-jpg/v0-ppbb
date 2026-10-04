
import { Module } from '@nestjs/common';
import { OfflineMeshVoiceController } from './offline-mesh-voice.controller';
import { OfflineMeshVoiceService } from './offline-mesh-voice.service';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, AuditCoreModule],
  controllers: [OfflineMeshVoiceController],
  providers: [OfflineMeshVoiceService],
  exports: [OfflineMeshVoiceService],
})
export class OfflineMeshVoiceModule {}
