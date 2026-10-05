import { Module } from '@nestjs/common';
import { OwnModelsController } from './own-models.controller';
import { OwnModelsService } from './own-models.service';
import { IdentityModule } from '../identity/identity.module';
import { UsageModule } from '../usage/usage.module';

@Module({
  imports: [IdentityModule, UsageModule],
  controllers: [OwnModelsController],
  providers: [OwnModelsService],
  exports: [OwnModelsService],
})
export class OwnModelsModule {}
