import { Module } from '@nestjs/common';
import { AiTrustNetworkController } from './ai-trust-network.controller';
import { AiTrustNetworkService } from './ai-trust-network.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [AiTrustNetworkController],
  providers: [AiTrustNetworkService],
  exports: [AiTrustNetworkService],
})
export class AiTrustNetworkModule {}
