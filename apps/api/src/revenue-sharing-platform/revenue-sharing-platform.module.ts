import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AieStoreModule } from '../aie-store/aie-store.module';
import { RevenueSharingPlatformController } from './revenue-sharing-platform.controller';
import { RevenueSharingPlatformService } from './revenue-sharing-platform.service';

@Module({
  imports: [IdentityModule, AieStoreModule],
  controllers: [RevenueSharingPlatformController],
  providers: [RevenueSharingPlatformService],
  exports: [RevenueSharingPlatformService],
})
export class RevenueSharingPlatformModule {}
