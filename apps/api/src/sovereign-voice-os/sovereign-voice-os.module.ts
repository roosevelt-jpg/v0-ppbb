import { Module } from '@nestjs/common';
import { SovereignVoiceOsController } from './sovereign-voice-os.controller';
import { SovereignVoiceOsService } from './sovereign-voice-os.service';
import { SovereignVoiceOsStreamGateway } from './sovereign-voice-os.stream';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [IdentityModule, AuditCoreModule, ApiKeysModule, PrismaModule],
  controllers: [SovereignVoiceOsController],
  providers: [SovereignVoiceOsService, SovereignVoiceOsStreamGateway],
  exports: [SovereignVoiceOsService, SovereignVoiceOsStreamGateway],
})
export class SovereignVoiceOsModule {}
