import { Module } from '@nestjs/common';
import { DeveloperGravityController } from './developer-gravity.controller';
import { DeveloperGravityService } from './developer-gravity.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule],
  controllers: [DeveloperGravityController],
  providers: [DeveloperGravityService],
  exports: [DeveloperGravityService],
})
export class DeveloperGravityModule {}
