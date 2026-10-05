import { Module } from '@nestjs/common';
import { OwnModelsController } from './own-models.controller';
import { OwnModelsService } from './own-models.service';
import { IdentityModule } from '../identity/identity.module';
import { UsageModule } from '../usage/usage.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [IdentityModule, UsageModule, GatewayModule],
  controllers: [OwnModelsController],
  providers: [OwnModelsService],
  exports: [OwnModelsService],
})
export class OwnModelsModule {}
