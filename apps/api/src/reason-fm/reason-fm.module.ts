import { Module } from '@nestjs/common';
import { ReasonFmController } from './reason-fm.controller';
import { ReasonFmService } from './reason-fm.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [ReasonFmController],
  providers: [ReasonFmService],
  exports: [ReasonFmService],
})
export class ReasonFmModule {}
