import { Module } from '@nestjs/common';
import { ModelRuntimeController } from './model-runtime.controller';
import { ModelRuntimeService } from './model-runtime.service';
import { IdentityModule } from '../identity/identity.module';

@Module({
  imports: [IdentityModule],
  controllers: [ModelRuntimeController],
  providers: [ModelRuntimeService],
  exports: [ModelRuntimeService],
})
export class ModelRuntimeModule {}
