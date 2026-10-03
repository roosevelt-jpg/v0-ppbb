import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { DcivStoreModule } from '../dciv-store/dciv-store.module';
import { GlobalAiFederationController } from './global-ai-federation.controller';
import { GlobalAiFederationService } from './global-ai-federation.service';

@Module({
  imports: [IdentityModule, DcivStoreModule],
  controllers: [GlobalAiFederationController],
  providers: [GlobalAiFederationService],
  exports: [GlobalAiFederationService],
})
export class GlobalAiFederationModule {}
