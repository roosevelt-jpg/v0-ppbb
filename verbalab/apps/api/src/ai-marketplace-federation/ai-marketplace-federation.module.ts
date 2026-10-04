import { Module } from '@nestjs/common';
import { AiMarketplaceFederationController } from './ai-marketplace-federation.controller';
import { AiMarketplaceFederationService } from './ai-marketplace-federation.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [AiMarketplaceFederationController],
  providers: [AiMarketplaceFederationService],
  exports: [AiMarketplaceFederationService],
})
export class AiMarketplaceFederationModule {}
