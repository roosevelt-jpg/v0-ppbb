import { Module } from '@nestjs/common';
import { PartnerConnectorsController } from './partner-connectors.controller';
import { PartnerConnectorsService } from './partner-connectors.service';
import { IdentityModule } from '../identity/identity.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [IdentityModule, PrismaModule],
  controllers: [PartnerConnectorsController],
  providers: [PartnerConnectorsService],
  exports: [PartnerConnectorsService],
})
export class PartnerConnectorsModule {}
