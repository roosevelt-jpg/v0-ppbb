import { Module } from '@nestjs/common';
import { VoicePassportController } from './voice-passport.controller';
import { VoicePassportService } from './voice-passport.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule],
  controllers: [VoicePassportController],
  providers: [VoicePassportService],
  exports: [VoicePassportService],
})
export class VoicePassportModule {}
