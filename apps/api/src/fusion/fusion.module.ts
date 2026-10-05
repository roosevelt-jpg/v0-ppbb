import { Module } from '@nestjs/common';
import { FusionController } from './fusion.controller';
import { FusionService } from './fusion.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [FusionController],
  providers: [FusionService],
  exports: [FusionService],
})
export class FusionModule {}
