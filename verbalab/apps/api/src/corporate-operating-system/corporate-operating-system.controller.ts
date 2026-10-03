import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { CorporateOperatingSystemService } from './corporate-operating-system.service';

@Controller('v1/corporate-operating-system')
export class CorporateOperatingSystemController {
  constructor(private readonly vcos: CorporateOperatingSystemService) {}

  @Get('products')
  products() {
    return this.vcos.products();
  }

  @Get('engine')
  engine() {
    return this.vcos.products();
  }

  @Get('routing')
  routing() {
    return this.vcos.routing();
  }

  @Get('constitution')
  constitution() {
    return this.vcos.constitution();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.vcos.overview(session);
  }

  @Get('records')
  @UseGuards(ClerkAuthGuard)
  records(@CurrentSession() session: SessionContext, @Query('domain') domain?: string) {
    return this.vcos.records(session, domain);
  }

  @Post('records')
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Body()
    body: {
      domain: string;
      kind: string;
      title: string;
      status?: string;
      summary?: string;
      ownerLabel?: string;
      content?: Record<string, unknown>;
    },
  ) {
    return this.vcos.createRecord(session, body);
  }

  @Get('monitoring')
  monitoring() {
    return this.vcos.monitoring();
  }
}
