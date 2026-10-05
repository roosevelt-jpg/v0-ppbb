import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { OwnModelsService } from './own-models.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';

@Controller('v1/own-models')
export class OwnModelsController {
  constructor(private readonly service: OwnModelsService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('families')
  families() {
    return this.service.list();
  }

  @Get('families/:id')
  family(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Get('gaps')
  gaps() {
    return this.service.gaps();
  }

  @Get('compare')
  compare(@Query('ids') ids?: string) {
    const list = (ids ?? 'baobab,echo,voice-fm,translate-fm')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return this.service.compare(list);
  }

  @Get('lab/recipes')
  labRecipes() {
    return this.service.labRecipes();
  }

  @Get('lab/preferences')
  @UseGuards(ClerkAuthGuard)
  labPreferences(@CurrentSession() session: SessionContext) {
    return this.service.labPreferences(session.organizationId);
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }

  @Post('route')
  @HttpCode(HttpStatus.OK)
  route(@Body() body: Record<string, unknown>) {
    return this.service.route(body ?? {});
  }

  @Post('estimate')
  @HttpCode(HttpStatus.OK)
  estimate(@Body() body: Record<string, unknown>) {
    return this.service.estimate(body ?? {});
  }

  @Post('lab/recommend')
  @HttpCode(HttpStatus.OK)
  labRecommend(@Body() body: Record<string, unknown>) {
    return this.service.labRecommend(body ?? {});
  }

  @Post('lab/try')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  labTry(@Body() body: Record<string, unknown>) {
    return this.service.labTry(body ?? {});
  }

  @Post('lab/compare')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  labCompare(@Body() body: Record<string, unknown>) {
    return this.service.labCompare(body ?? {});
  }

  @Post('lab/prefer')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  labPrefer(@CurrentSession() session: SessionContext, @Body() body: Record<string, unknown>) {
    return this.service.labPrefer(session, body ?? {});
  }
}
