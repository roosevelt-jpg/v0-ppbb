import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { AieStoreModule } from '../aie-store/aie-store.module';
import { EconomicIntelligenceController } from './economic-intelligence.controller';
import { EconomicIntelligenceService } from './economic-intelligence.service';

@Module({
  imports: [IdentityModule, AieStoreModule],
  controllers: [EconomicIntelligenceController],
  providers: [EconomicIntelligenceService],
  exports: [EconomicIntelligenceService],
})
export class EconomicIntelligenceModule {}
