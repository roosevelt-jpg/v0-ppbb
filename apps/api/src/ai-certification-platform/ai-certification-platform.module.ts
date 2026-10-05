import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VgasStoreModule } from '../vgas-store/vgas-store.module';
import { AiCertificationPlatformController } from './ai-certification-platform.controller';
import { AiCertificationPlatformService } from './ai-certification-platform.service';

@Module({
  imports: [IdentityModule, VgasStoreModule],
  controllers: [AiCertificationPlatformController],
  providers: [AiCertificationPlatformService],
  exports: [AiCertificationPlatformService],
})
export class AiCertificationPlatformModule {}
