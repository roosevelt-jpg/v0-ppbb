import { Module } from '@nestjs/common';
import { VerticalGlossariesController } from './vertical-glossaries.controller';
import { VerticalGlossariesService } from './vertical-glossaries.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule],
  controllers: [VerticalGlossariesController],
  providers: [VerticalGlossariesService],
  exports: [VerticalGlossariesService],
})
export class VerticalGlossariesModule {}
