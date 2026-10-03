import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VgasStoreModule } from '../vgas-store/vgas-store.module';
import { GlobalPartnerProgramController } from './global-partner-program.controller';
import { GlobalPartnerProgramService } from './global-partner-program.service';

@Module({
  imports: [IdentityModule, VgasStoreModule],
  controllers: [GlobalPartnerProgramController],
  providers: [GlobalPartnerProgramService],
  exports: [GlobalPartnerProgramService],
})
export class GlobalPartnerProgramModule {}
