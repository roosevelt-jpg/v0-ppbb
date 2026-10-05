import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AieStoreModule } from '../aie-store/aie-store.module';
import { AiCommercePlatformController } from './ai-commerce-platform.controller';
import { AiCommercePlatformService } from './ai-commerce-platform.service';

@Module({
  imports: [IdentityModule, AieStoreModule],
  controllers: [AiCommercePlatformController],
  providers: [AiCommercePlatformService],
  exports: [AiCommercePlatformService],
})
export class AiCommercePlatformModule {}
