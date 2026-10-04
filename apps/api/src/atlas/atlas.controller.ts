import { Controller, Get, UseGuards, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AtlasService } from './atlas.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/atlas')
export class AtlasController {
  constructor(private readonly atlas: AtlasService) {}

  @Get('engine')
  engine() {
    return this.atlas.engine();
  }

  @Get('capabilities')
  capabilities() {
    return this.atlas.capabilities();
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.atlas.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.atlas.monitoring();
  }


  @Post('specialize')
  @HttpCode(HttpStatus.OK)
  specialize(@Body() body: { domain?: string; query?: string }) {
    return this.atlas.specialize({ domain: body.domain, query: body.query });
  }
}
