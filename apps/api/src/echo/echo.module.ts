import { Module } from '@nestjs/common';
import { EchoController } from './echo.controller';
import { EchoService } from './echo.service';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [UsageModule, IdentityModule],
  controllers: [EchoController],
  providers: [EchoService],
  exports: [EchoService],
})
export class EchoModule {}
