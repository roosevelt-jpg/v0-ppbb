import { Module } from '@nestjs/common';
import { AiGlobalRoutingController } from './ai-global-routing.controller';
import { AiGlobalRoutingService } from './ai-global-routing.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [AiGlobalRoutingController],
  providers: [AiGlobalRoutingService],
  exports: [AiGlobalRoutingService],
})
export class AiGlobalRoutingModule {}
