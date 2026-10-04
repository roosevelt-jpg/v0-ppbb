import { Module } from '@nestjs/common';
import { AiSovereigntyExchangeController } from './ai-sovereignty-exchange.controller';
import { AiSovereigntyExchangeService } from './ai-sovereignty-exchange.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [AiSovereigntyExchangeController],
  providers: [AiSovereigntyExchangeService],
  exports: [AiSovereigntyExchangeService],
})
export class AiSovereigntyExchangeModule {}
