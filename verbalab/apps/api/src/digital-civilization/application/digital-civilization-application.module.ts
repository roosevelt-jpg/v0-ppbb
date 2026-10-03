import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DigitalCivilizationModule } from '../digital-civilization.module';
import { GetDigitalCivilizationEngineHandler, ListDigitalCivilizationProductsHandler } from './handlers';
import { NestDigitalCivilizationAdapter } from './nest-digital-civilization.adapter';

@Module({
  imports: [CqrsModule, DigitalCivilizationModule],
  providers: [GetDigitalCivilizationEngineHandler, ListDigitalCivilizationProductsHandler, NestDigitalCivilizationAdapter],
  exports: [NestDigitalCivilizationAdapter],
})
export class DigitalCivilizationApplicationModule {}
