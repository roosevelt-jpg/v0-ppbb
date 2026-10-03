import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AieStoreModule } from '../aie-store/aie-store.module';
import { AiInvestmentPlatformController } from './ai-investment-platform.controller';
import { AiInvestmentPlatformService } from './ai-investment-platform.service';

@Module({
  imports: [IdentityModule, AieStoreModule],
  controllers: [AiInvestmentPlatformController],
  providers: [AiInvestmentPlatformService],
  exports: [AiInvestmentPlatformService],
})
export class AiInvestmentPlatformModule {}
