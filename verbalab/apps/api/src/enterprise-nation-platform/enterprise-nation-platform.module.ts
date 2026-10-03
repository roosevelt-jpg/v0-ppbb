import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { DcivStoreModule } from '../dciv-store/dciv-store.module';
import { EnterpriseNationPlatformController } from './enterprise-nation-platform.controller';
import { EnterpriseNationPlatformService } from './enterprise-nation-platform.service';

@Module({
  imports: [IdentityModule, DcivStoreModule],
  controllers: [EnterpriseNationPlatformController],
  providers: [EnterpriseNationPlatformService],
  exports: [EnterpriseNationPlatformService],
})
export class EnterpriseNationPlatformModule {}
