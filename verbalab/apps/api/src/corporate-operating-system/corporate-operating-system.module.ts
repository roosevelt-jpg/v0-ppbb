import { Module } from '@nestjs/common';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { VcosStoreModule } from '../vcos-store/vcos-store.module';
import { CorporateOperatingSystemController } from './corporate-operating-system.controller';
import { CorporateOperatingSystemService } from './corporate-operating-system.service';

@Module({
  imports: [UsageModule, IdentityModule, VcosStoreModule],
  controllers: [CorporateOperatingSystemController],
  providers: [CorporateOperatingSystemService],
  exports: [CorporateOperatingSystemService],
})
export class CorporateOperatingSystemModule {}
