import { Module } from '@nestjs/common';
import { ModelKeysController } from './model-keys.controller';
import { ModelKeysService } from './model-keys.service';
import { PrismaModule } from '../prisma/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';

@Module({
  imports: [PrismaModule, IdentityModule, AuditCoreModule],
  controllers: [ModelKeysController],
  providers: [ModelKeysService],
  exports: [ModelKeysService],
})
export class ModelKeysModule {}
