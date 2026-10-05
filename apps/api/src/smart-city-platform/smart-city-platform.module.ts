import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { DcivStoreModule } from '../dciv-store/dciv-store.module';
import { SmartCityPlatformController } from './smart-city-platform.controller';
import { SmartCityPlatformService } from './smart-city-platform.service';

@Module({
  imports: [IdentityModule, DcivStoreModule],
  controllers: [SmartCityPlatformController],
  providers: [SmartCityPlatformService],
  exports: [SmartCityPlatformService],
})
export class SmartCityPlatformModule {}
