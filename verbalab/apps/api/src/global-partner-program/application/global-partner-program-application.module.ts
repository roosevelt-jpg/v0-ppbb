import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GlobalPartnerProgramModule } from '../global-partner-program.module';
import { GLOBAL_PARTNER_PROGRAM_CATALOG_PORT } from './ports';
import { NestGlobalPartnerProgramCatalogAdapter } from './nest-global-partner-program.adapter';
import { GLOBAL_PARTNER_PROGRAM_HANDLERS } from './handlers';

@Module({
  imports: [CqrsModule, GlobalPartnerProgramModule],
  providers: [
    NestGlobalPartnerProgramCatalogAdapter,
    { provide: GLOBAL_PARTNER_PROGRAM_CATALOG_PORT, useExisting: NestGlobalPartnerProgramCatalogAdapter },
    ...GLOBAL_PARTNER_PROGRAM_HANDLERS,
  ],
  exports: [CqrsModule],
})
export class GlobalPartnerProgramApplicationModule {}
