import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VcosStoreModule } from '../vcos-store/vcos-store.module';
import { CorporateRiskPlatformController } from './corporate-risk-platform.controller';
import { CorporateRiskPlatformService } from './corporate-risk-platform.service';

@Module({
  imports: [IdentityModule, VcosStoreModule],
  controllers: [CorporateRiskPlatformController],
  providers: [CorporateRiskPlatformService],
  exports: [CorporateRiskPlatformService],
})
export class CorporateRiskPlatformModule {}
