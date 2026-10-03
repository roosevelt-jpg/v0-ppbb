import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SmartCityPlatformModule } from '../smart-city-platform.module';
import { GetSmartCityPlatformEngineHandler, ListSmartCityPlatformProductsHandler } from './handlers';
import { NestSmartCityPlatformAdapter } from './nest-smart-city-platform.adapter';

@Module({
  imports: [CqrsModule, SmartCityPlatformModule],
  providers: [GetSmartCityPlatformEngineHandler, ListSmartCityPlatformProductsHandler, NestSmartCityPlatformAdapter],
  exports: [NestSmartCityPlatformAdapter],
})
export class SmartCityPlatformApplicationModule {}
