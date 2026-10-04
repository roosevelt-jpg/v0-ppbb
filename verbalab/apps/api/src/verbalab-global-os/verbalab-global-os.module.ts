import { Module } from '@nestjs/common';
import { VerbalabGlobalOsController } from './verbalab-global-os.controller';
import { VerbalabGlobalOsService } from './verbalab-global-os.service';
import { IdentityModule } from '../identity/identity.module';
import { AiInternetStoreModule } from '../ai-internet-store/ai-internet-store.module';

@Module({
  imports: [IdentityModule, AiInternetStoreModule],
  controllers: [VerbalabGlobalOsController],
  providers: [VerbalabGlobalOsService],
  exports: [VerbalabGlobalOsService],
})
export class VerbalabGlobalOsModule {}
