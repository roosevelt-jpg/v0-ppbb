import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VcosStoreModule } from '../vcos-store/vcos-store.module';
import { CorporateGovernancePlatformController } from './corporate-governance-platform.controller';
import { CorporateGovernancePlatformService } from './corporate-governance-platform.service';

@Module({
  imports: [IdentityModule, VcosStoreModule],
  controllers: [CorporateGovernancePlatformController],
  providers: [CorporateGovernancePlatformService],
  exports: [CorporateGovernancePlatformService],
})
export class CorporateGovernancePlatformModule {}
