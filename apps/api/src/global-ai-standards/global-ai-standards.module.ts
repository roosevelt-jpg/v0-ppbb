import { Module } from '@nestjs/common';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { VgasStoreModule } from '../vgas-store/vgas-store.module';
import { GlobalAiStandardsController } from './global-ai-standards.controller';
import { GlobalAiStandardsService } from './global-ai-standards.service';

@Module({
  imports: [UsageModule, IdentityModule, VgasStoreModule],
  controllers: [GlobalAiStandardsController],
  providers: [GlobalAiStandardsService],
  exports: [GlobalAiStandardsService],
})
export class GlobalAiStandardsModule {}
