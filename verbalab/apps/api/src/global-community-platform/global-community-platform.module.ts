import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AieStoreModule } from '../aie-store/aie-store.module';
import { GlobalCommunityPlatformController } from './global-community-platform.controller';
import { GlobalCommunityPlatformService } from './global-community-platform.service';

@Module({
  imports: [IdentityModule, AieStoreModule],
  controllers: [GlobalCommunityPlatformController],
  providers: [GlobalCommunityPlatformService],
  exports: [GlobalCommunityPlatformService],
})
export class GlobalCommunityPlatformModule {}
