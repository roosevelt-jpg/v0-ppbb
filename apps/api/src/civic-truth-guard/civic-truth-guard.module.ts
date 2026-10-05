import { Module } from '@nestjs/common';
import { CivicTruthGuardController } from './civic-truth-guard.controller';
import { CivicTruthGuardService } from './civic-truth-guard.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { CivicVoiceSealModule } from '../civic-voice-seal/civic-voice-seal.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule, CivicVoiceSealModule],
  controllers: [CivicTruthGuardController],
  providers: [CivicTruthGuardService],
  exports: [CivicTruthGuardService],
})
export class CivicTruthGuardModule {}
