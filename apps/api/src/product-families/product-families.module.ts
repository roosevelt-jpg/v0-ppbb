import { Module } from '@nestjs/common';
import { ProductFamiliesController } from './product-families.controller';
import { ProductFamiliesService } from './product-families.service';
import { IdentityModule } from '../identity/identity.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [IdentityModule, BillingModule],
  controllers: [ProductFamiliesController],
  providers: [ProductFamiliesService],
  exports: [ProductFamiliesService],
})
export class ProductFamiliesModule {}
