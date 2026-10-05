import { Body, Controller, Get, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '../common/errors/api-exception';
import { ClerkAuthGuard } from '../common/guards/clerk-auth.guard';
import { PRODUCT_PREFILLS } from './marketing-cms.pages';
import { MarketingCmsService } from './marketing-cms.service';

@Controller('v1/cms')
export class MarketingCmsController {
  constructor(private readonly cms: MarketingCmsService) {}

  @Get('settings')
  getSettings() {
    return this.cms.getSettings();
  }

  @Get('pages')
  listPages() {
    return this.cms.listPages();
  }

  @Get('pages/:slug')
  async getPage(@Param('slug') slug: string) {
    const data = await this.cms.getPageBySlug(slug);
    if (!data) {
      throw new ApiException('not_found', 'CMS page not found', HttpStatus.NOT_FOUND);
    }
    return data;
  }

  @Get('prefills/:surface')
  getPrefill(@Param('surface') surface: string) {
    if (!(surface in PRODUCT_PREFILLS)) {
      throw new ApiException('not_found', 'Unknown prefill surface', HttpStatus.NOT_FOUND);
    }
    return this.cms.getPrefill(surface as keyof typeof PRODUCT_PREFILLS);
  }

  @Put('settings')
  @UseGuards(ClerkAuthGuard)
  updateSettings(
    @Body()
    body: {
      brandName?: string;
      tagline?: string;
      defaultTheme?: string;
      primaryColor?: string;
      accentColor?: string;
      headerLogoUrl?: string;
      footerLogoUrl?: string;
      faviconUrl?: string;
      emailLogoUrl?: string;
      copyrightText?: string;
      designScope?: Prisma.InputJsonValue;
      socialLinks?: Prisma.InputJsonValue;
    },
  ) {
    return this.cms.updateSettings(body);
  }

  @Post('blocks')
  @UseGuards(ClerkAuthGuard)
  upsertBlock(
    @Body()
    body: {
      pageSlug: string;
      blockId?: string;
      type: string;
      sortOrder?: number;
      content: Prisma.InputJsonValue;
      published?: boolean;
    },
  ) {
    return this.cms.upsertBlock(body);
  }

  @Post('assets')
  @UseGuards(ClerkAuthGuard)
  upsertAsset(
    @Body()
    body: { pageSlug?: string; key: string; url: string; alt?: string; kind?: string },
  ) {
    return this.cms.upsertAsset(body);
  }

  @Post('pages/:slug/review')
  @UseGuards(ClerkAuthGuard)
  setReview(
    @Param('slug') slug: string,
    @Body() body: { reviewStatus: 'pending_review' | 'approved' },
  ) {
    return this.cms.setReviewStatus(slug, body.reviewStatus);
  }

  @Post('reseed-home')
  @UseGuards(ClerkAuthGuard)
  reseedHome() {
    return this.cms.reseedHome();
  }
}
