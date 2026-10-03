import { Module } from '@nestjs/common';
import { BaobabController } from './baobab.controller';
import { BaobabService } from './baobab.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [BaobabController],
  providers: [BaobabService],
  exports: [BaobabService],
})
export class BaobabModule {}
