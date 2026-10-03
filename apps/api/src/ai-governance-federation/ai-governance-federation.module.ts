import { Module } from '@nestjs/common';
import { AiGovernanceFederationController } from './ai-governance-federation.controller';
import { AiGovernanceFederationService } from './ai-governance-federation.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [AiGovernanceFederationController],
  providers: [AiGovernanceFederationService],
  exports: [AiGovernanceFederationService],
})
export class AiGovernanceFederationModule {}
