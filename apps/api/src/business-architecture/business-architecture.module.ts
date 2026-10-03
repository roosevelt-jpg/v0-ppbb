import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { VcosStoreModule } from '../vcos-store/vcos-store.module';
import { BusinessArchitectureController } from './business-architecture.controller';
import { BusinessArchitectureService } from './business-architecture.service';

@Module({
  imports: [IdentityModule, VcosStoreModule],
  controllers: [BusinessArchitectureController],
  providers: [BusinessArchitectureService],
  exports: [BusinessArchitectureService],
})
export class BusinessArchitectureModule {}
