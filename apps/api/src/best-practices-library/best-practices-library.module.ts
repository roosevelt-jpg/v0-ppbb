import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VgasStoreModule } from '../vgas-store/vgas-store.module';
import { BestPracticesLibraryController } from './best-practices-library.controller';
import { BestPracticesLibraryService } from './best-practices-library.service';

@Module({
  imports: [IdentityModule, VgasStoreModule],
  controllers: [BestPracticesLibraryController],
  providers: [BestPracticesLibraryService],
  exports: [BestPracticesLibraryService],
})
export class BestPracticesLibraryModule {}
