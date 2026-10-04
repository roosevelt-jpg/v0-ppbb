import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { PartnerConnectorsService } from './partner-connectors.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { ApiKeyGuard, ApiKeyContext } from '../common/guards/api-key.guard';
import { CurrentApiKey, CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';
import type { JsonRpcRequest } from './partner-connectors.mcp';

@Controller('v1/partner-connectors')
export class PartnerConnectorsController {
  constructor(private readonly service: PartnerConnectorsService) {}

  @Get('engine')
  engine() {
    return this.service.engine();
  }

  @Get('platforms')
  platforms(@Query('kind') kind?: string) {
    return this.service.platforms(kind);
  }

  @Get('registry')
  registry(@Query('kind') kind?: string) {
    return this.service.registry(kind);
  }

  @Get('platforms/:id')
  platform(@Param('id') id: string) {
    const row = this.service.platform(id);
    if (!row) {
      throw new ApiException('not_found', `Unknown platform: ${id}`, HttpStatus.NOT_FOUND);
    }
    return row;
  }

  @Get('tools')
  tools() {
    return this.service.tools();
  }

  @Get('mcp/manifest')
  mcpManifest() {
    return this.service.mcpManifest();
  }

  @Post('mcp')
  mcp(@Body() body: JsonRpcRequest) {
    return this.service.mcp(body ?? {});
  }

  @Post('invoke')
  async invoke(
    @Req() req: Request & { apiKeyAuth?: ApiKeyContext },
    @Body()
    body: { tool?: string; arguments?: Record<string, unknown>; platformId?: string },
  ) {
    const tool = body.tool?.trim();
    if (!tool) {
      throw new ApiException('validation_error', 'tool is required', HttpStatus.BAD_REQUEST);
    }
    // Prefer API key when present; allow local/fixture invoke without auth for partner demos.
    const authHeader = req.headers.authorization;
    const fixture =
      process.env.VERBALAB_OWN_AI_FIXTURE === '1' ||
      process.env.VERBALAB_LOCAL_MODEL_RUNTIME !== '0';
    if (!authHeader && !fixture) {
      throw new ApiException(
        'unauthorized',
        'Bearer vl_* API key required (or enable local Own AI runtime)',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.service.invoke(tool, body.arguments ?? {}, { platformId: body.platformId });
  }

  @Post('invoke/secure')
  @UseGuards(ApiKeyGuard)
  invokeSecure(
    @CurrentApiKey() _auth: ApiKeyContext,
    @Body()
    body: { tool?: string; arguments?: Record<string, unknown>; platformId?: string },
  ) {
    const tool = body.tool?.trim();
    if (!tool) {
      throw new ApiException('validation_error', 'tool is required', HttpStatus.BAD_REQUEST);
    }
    return this.service.invoke(tool, body.arguments ?? {}, { platformId: body.platformId });
  }

  @Get('installations')
  @UseGuards(ClerkAuthGuard)
  listInstallations(@CurrentSession() session: SessionContext) {
    return this.service.listInstallations(session.organizationId);
  }

  @Post('installations')
  @UseGuards(ClerkAuthGuard)
  install(
    @CurrentSession() session: SessionContext,
    @Body()
    body: { platformId?: string; label?: string; webhookUrl?: string; scopes?: string[] },
  ) {
    return this.service.install(session, body);
  }

  @Post('webhooks/test')
  @UseGuards(ClerkAuthGuard)
  testWebhook(
    @CurrentSession() session: SessionContext,
    @Body() body: { installationId?: string },
  ) {
    return this.service.testWebhook(session.organizationId, body?.installationId);
  }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) {
    return this.service.overview(session);
  }

  @Get('monitoring')
  monitoring() {
    return this.service.monitoring();
  }
}
