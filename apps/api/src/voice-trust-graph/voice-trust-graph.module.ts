import { Module } from '@nestjs/common';
import { VoiceTrustGraphController } from './voice-trust-graph.controller';
import { VoiceTrustGraphService } from './voice-trust-graph.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule],
  controllers: [VoiceTrustGraphController],
  providers: [VoiceTrustGraphService],
  exports: [VoiceTrustGraphService],
})
export class VoiceTrustGraphModule {}
