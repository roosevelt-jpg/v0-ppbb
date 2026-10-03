import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { RevenueSharingPlatformModule } from '../revenue-sharing-platform.module';
import { GetRevenueSharingPlatformEngineHandler, ListRevenueSharingPlatformProductsHandler } from './handlers';
import { NestRevenueSharingPlatformAdapter } from './nest-revenue-sharing-platform.adapter';

@Module({
  imports: [CqrsModule, RevenueSharingPlatformModule],
  providers: [GetRevenueSharingPlatformEngineHandler, ListRevenueSharingPlatformProductsHandler, NestRevenueSharingPlatformAdapter],
  exports: [NestRevenueSharingPlatformAdapter],
})
export class RevenueSharingPlatformApplicationModule {}
