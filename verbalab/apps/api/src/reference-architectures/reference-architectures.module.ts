import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VgasStoreModule } from '../vgas-store/vgas-store.module';
import { ReferenceArchitecturesController } from './reference-architectures.controller';
import { ReferenceArchitecturesService } from './reference-architectures.service';

@Module({
  imports: [IdentityModule, VgasStoreModule],
  controllers: [ReferenceArchitecturesController],
  providers: [ReferenceArchitecturesService],
  exports: [ReferenceArchitecturesService],
})
export class ReferenceArchitecturesModule {}
