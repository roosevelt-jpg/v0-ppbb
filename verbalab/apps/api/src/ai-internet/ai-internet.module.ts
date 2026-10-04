import { Module } from '@nestjs/common';
import { AiInternetController } from './ai-internet.controller';
import { AiInternetService } from './ai-internet.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [AiInternetController],
  providers: [AiInternetService],
  exports: [AiInternetService],
})
export class AiInternetModule {}
