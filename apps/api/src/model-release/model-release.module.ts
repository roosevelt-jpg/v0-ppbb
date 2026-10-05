import { Module } from '@nestjs/common';
import { ModelReleaseController } from './model-release.controller';
import { ModelReleaseService } from './model-release.service';
import { IdentityModule } from '../identity/identity.module';
import { AuditCoreModule } from '../audit/audit-core.module';
import { UsageModule } from '../usage/usage.module';
import { GpuPlatformModule } from '../gpu-platform/gpu-platform.module';

@Module({
  imports: [IdentityModule, AuditCoreModule, UsageModule, GpuPlatformModule],
  controllers: [ModelReleaseController],
  providers: [ModelReleaseService],
  exports: [ModelReleaseService],
})
export class ModelReleaseModule {}
