import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VcosStoreModule } from '../vcos-store/vcos-store.module';
import { ExecutiveIntelligencePlatformController } from './executive-intelligence-platform.controller';
import { ExecutiveIntelligencePlatformService } from './executive-intelligence-platform.service';

@Module({
  imports: [IdentityModule, VcosStoreModule],
  controllers: [ExecutiveIntelligencePlatformController],
  providers: [ExecutiveIntelligencePlatformService],
  exports: [ExecutiveIntelligencePlatformService],
})
export class ExecutiveIntelligencePlatformModule {}
