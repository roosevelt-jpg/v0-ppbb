import { Module } from '@nestjs/common';
import { TranslateFmController } from './translate-fm.controller';
import { TranslateFmService } from './translate-fm.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [TranslateFmController],
  providers: [TranslateFmService],
  exports: [TranslateFmService],
})
export class TranslateFmModule {}
