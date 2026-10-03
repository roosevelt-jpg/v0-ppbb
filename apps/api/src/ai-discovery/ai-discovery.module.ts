import { Module } from '@nestjs/common';
import { AiDiscoveryController } from './ai-discovery.controller';
import { AiDiscoveryService } from './ai-discovery.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [AiDiscoveryController],
  providers: [AiDiscoveryService],
  exports: [AiDiscoveryService],
})
export class AiDiscoveryModule {}
