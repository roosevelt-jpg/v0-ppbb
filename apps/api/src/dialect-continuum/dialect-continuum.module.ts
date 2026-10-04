import { Module } from '@nestjs/common';
import { DialectContinuumController } from './dialect-continuum.controller';
import { DialectContinuumService } from './dialect-continuum.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule],
  controllers: [DialectContinuumController],
  providers: [DialectContinuumService],
  exports: [DialectContinuumService],
})
export class DialectContinuumModule {}
