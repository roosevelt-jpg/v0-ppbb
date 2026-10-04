import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EnterpriseNationPlatformModule } from '../enterprise-nation-platform.module';
import { GetEnterpriseNationPlatformEngineHandler, ListEnterpriseNationPlatformProductsHandler } from './handlers';
import { NestEnterpriseNationPlatformAdapter } from './nest-enterprise-nation-platform.adapter';

@Module({
  imports: [CqrsModule, EnterpriseNationPlatformModule],
  providers: [GetEnterpriseNationPlatformEngineHandler, ListEnterpriseNationPlatformProductsHandler, NestEnterpriseNationPlatformAdapter],
  exports: [NestEnterpriseNationPlatformAdapter],
})
export class EnterpriseNationPlatformApplicationModule {}
