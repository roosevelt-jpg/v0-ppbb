import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { ModelKeysService } from './model-keys.service';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { ApiException } from '../common/errors/api-exception';
import { clientIp } from '../common/http/client-ip';

@Controller('v1/model-keys')
export class ModelKeysController {
  constructor(private readonly modelKeys: ModelKeysService) {}

  @Get('guide')
  guide() {
    return this.modelKeys.guide();
  }

  @Get('models')
  models() {
    return this.modelKeys.modelsCatalog();
  }

  @Get()
  @UseGuards(ClerkAuthGuard)
  list(@CurrentSession() session: SessionContext) {
    return this.modelKeys.list(session.organizationId);
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: { name?: string; environment?: string; scopes?: string[] },
  ) {
    const name = body.name?.trim();
    if (!name) {
      throw new ApiException('validation_error', 'name is required', HttpStatus.BAD_REQUEST);
    }
    return this.modelKeys.create({
      organizationId: session.organizationId,
      workspaceId: session.workspaceId,
      userId: session.userId,
      role: session.role,
      name,
      environment: body.environment,
      scopes: body.scopes,
      ip: clientIp(req),
    });
  }

  @Post('platform-root')
  @UseGuards(ClerkAuthGuard)
  mintRoot(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Body() body: { name?: string },
  ) {
    return this.modelKeys.mintPlatformRoot({
      organizationId: session.organizationId,
      userId: session.userId,
      role: session.role,
      name: body?.name,
      ip: clientIp(req),
    });
  }

  @Post('verify')
  async verify(@Body() body: { token?: string; modality?: string }) {
    const token = body.token?.trim();
    if (!token) {
      throw new ApiException('validation_error', 'token is required', HttpStatus.BAD_REQUEST);
    }
    const result = await this.modelKeys.verifyBearer(token, body.modality);
    if (!result.ok) {
      throw new ApiException('unauthorized', `Invalid model key (${result.reason})`, HttpStatus.UNAUTHORIZED);
    }
    return { valid: true, kind: result.kind, organizationId: result.organizationId, keyId: result.keyId };
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  revoke(
    @CurrentSession() session: SessionContext,
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    return this.modelKeys.revoke(session.organizationId, id, {
      userId: session.userId,
      role: session.role,
      ip: clientIp(req),
    });
  }
}
