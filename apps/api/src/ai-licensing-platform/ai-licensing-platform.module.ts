import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AieStoreModule } from '../aie-store/aie-store.module';
import { AiLicensingPlatformController } from './ai-licensing-platform.controller';
import { AiLicensingPlatformService } from './ai-licensing-platform.service';

@Module({
  imports: [IdentityModule, AieStoreModule],
  controllers: [AiLicensingPlatformController],
  providers: [AiLicensingPlatformService],
  exports: [AiLicensingPlatformService],
})
export class AiLicensingPlatformModule {}
