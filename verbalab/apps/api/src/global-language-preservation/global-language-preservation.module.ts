import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { DcivStoreModule } from '../dciv-store/dciv-store.module';
import { GlobalLanguagePreservationController } from './global-language-preservation.controller';
import { GlobalLanguagePreservationService } from './global-language-preservation.service';

@Module({
  imports: [IdentityModule, DcivStoreModule],
  controllers: [GlobalLanguagePreservationController],
  providers: [GlobalLanguagePreservationService],
  exports: [GlobalLanguagePreservationService],
})
export class GlobalLanguagePreservationModule {}
