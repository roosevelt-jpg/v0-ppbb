import { Module } from '@nestjs/common';
import { InterpreterMeshController } from './interpreter-mesh.controller';
import { InterpreterMeshService } from './interpreter-mesh.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { TranslateModule } from '../translate/translate.module';

@Module({
  imports: [IdentityModule, PrismaModule, AuditCoreModule, TranslateModule],
  controllers: [InterpreterMeshController],
  providers: [InterpreterMeshService],
  exports: [InterpreterMeshService],
})
export class InterpreterMeshModule {}
