import { Module } from '@nestjs/common';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { DcivStoreModule } from '../dciv-store/dciv-store.module';
import { DigitalCivilizationController } from './digital-civilization.controller';
import { DigitalCivilizationService } from './digital-civilization.service';

@Module({
  imports: [UsageModule, IdentityModule, DcivStoreModule],
  controllers: [DigitalCivilizationController],
  providers: [DigitalCivilizationService],
  exports: [DigitalCivilizationService],
})
export class DigitalCivilizationModule {}
