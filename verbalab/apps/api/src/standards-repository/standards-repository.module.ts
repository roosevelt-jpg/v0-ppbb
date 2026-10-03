import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VgasStoreModule } from '../vgas-store/vgas-store.module';
import { StandardsRepositoryController } from './standards-repository.controller';
import { StandardsRepositoryService } from './standards-repository.service';

@Module({
  imports: [IdentityModule, VgasStoreModule],
  controllers: [StandardsRepositoryController],
  providers: [StandardsRepositoryService],
  exports: [StandardsRepositoryService],
})
export class StandardsRepositoryModule {}
