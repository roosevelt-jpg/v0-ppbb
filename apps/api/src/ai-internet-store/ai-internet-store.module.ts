import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiInternetStoreService } from './ai-internet-store.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AiInternetStoreService],
  exports: [AiInternetStoreService],
})
export class AiInternetStoreModule {}
