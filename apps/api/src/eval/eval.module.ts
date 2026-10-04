import { Module } from '@nestjs/common';
import { CoverageController } from './coverage.controller';
import { EvalService } from './eval.service';
import { GatewayModule } from '../gateway/gateway.module';
import { LanguagesModule } from '../languages/languages.module';
import { IdentityModule } from '../identity/identity.module';
import { CountryPacksModule } from '../country-packs/country-packs.module';

@Module({
  imports: [GatewayModule, LanguagesModule, IdentityModule, CountryPacksModule],
  controllers: [CoverageController],
  providers: [EvalService],
  exports: [EvalService],
})
export class EvalModule {}
