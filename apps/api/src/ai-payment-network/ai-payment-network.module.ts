import { Module } from '@nestjs/common';
import { AiPaymentNetworkController } from './ai-payment-network.controller';
import { AiPaymentNetworkService } from './ai-payment-network.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [AiPaymentNetworkController],
  providers: [AiPaymentNetworkService],
  exports: [AiPaymentNetworkService],
})
export class AiPaymentNetworkModule {}
