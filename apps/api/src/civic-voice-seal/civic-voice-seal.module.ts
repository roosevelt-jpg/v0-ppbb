import { Module } from '@nestjs/common';
import { CivicVoiceSealController } from './civic-voice-seal.controller';
import { CivicVoiceSealService } from './civic-voice-seal.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule],
  controllers: [CivicVoiceSealController],
  providers: [CivicVoiceSealService],
  exports: [CivicVoiceSealService],
})
export class CivicVoiceSealModule {}
