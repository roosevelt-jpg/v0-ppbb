import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { DcivStoreModule } from '../dciv-store/dciv-store.module';
import { UniversalTranslationGridController } from './universal-translation-grid.controller';
import { UniversalTranslationGridService } from './universal-translation-grid.service';

@Module({
  imports: [IdentityModule, DcivStoreModule],
  controllers: [UniversalTranslationGridController],
  providers: [UniversalTranslationGridService],
  exports: [UniversalTranslationGridService],
})
export class UniversalTranslationGridModule {}
