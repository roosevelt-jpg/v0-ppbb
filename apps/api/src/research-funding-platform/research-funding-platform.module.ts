import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AieStoreModule } from '../aie-store/aie-store.module';
import { ResearchFundingPlatformController } from './research-funding-platform.controller';
import { ResearchFundingPlatformService } from './research-funding-platform.service';

@Module({
  imports: [IdentityModule, AieStoreModule],
  controllers: [ResearchFundingPlatformController],
  providers: [ResearchFundingPlatformService],
  exports: [ResearchFundingPlatformService],
})
export class ResearchFundingPlatformModule {}
