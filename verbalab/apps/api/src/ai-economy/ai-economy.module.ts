import { Module } from '@nestjs/common';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { AieStoreModule } from '../aie-store/aie-store.module';
import { AiEconomyController } from './ai-economy.controller';
import { AiEconomyService } from './ai-economy.service';

@Module({
  imports: [UsageModule, IdentityModule, AieStoreModule],
  controllers: [AiEconomyController],
  providers: [AiEconomyService],
  exports: [AiEconomyService],
})
export class AiEconomyModule {}
