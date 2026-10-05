import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { AiCommercePlatformService } from './ai-commerce-platform.service';

@Controller('v1/ai-commerce-platform')
export class AiCommercePlatformController {
  constructor(private readonly service: AiCommercePlatformService) {}

  @Get('engine')
  engine() { return this.service.engine(); }

  @Get('products')
  products() { return this.service.products(); }

  @Get('monitoring')
  monitoring() { return this.service.monitoring(); }

  @Get('routes')
  routes() { return this.service.routes(); }

  @Get('records')
  @UseGuards(ClerkAuthGuard)
  records(@CurrentSession() session: SessionContext) { return this.service.records(session); }

  @Post('records')
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Body() body: { kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    return this.service.createRecord(session, body);
  }
}
