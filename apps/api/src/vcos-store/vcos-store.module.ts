import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VcosStoreService } from './vcos-store.service';

@Module({
  imports: [PrismaModule],
  providers: [VcosStoreService],
  exports: [VcosStoreService],
})
export class VcosStoreModule {}
