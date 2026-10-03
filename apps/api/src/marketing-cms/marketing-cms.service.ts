import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_ASSETS,
  DEFAULT_DESIGN_SCOPE,
  DEFAULT_HOME_BLOCKS,
} from './marketing-cms.catalog';

@Injectable()
export class MarketingCmsService implements OnModuleInit {
  private readonly log = new Logger(MarketingCmsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureSeeded();
    } catch (err) {
      this.log.warn(`CMS seed skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async ensureSeeded() {
    await this.prisma.cmsSiteSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        brandName: 'VerbaLab',
        tagline: "Africa's voice intelligence platform",
        defaultTheme: 'system',
        primaryColor: '#1a6b52',
        accentColor: '#6fcf9c',
        designScope: DEFAULT_DESIGN_SCOPE as unknown as Prisma.InputJsonValue,
        socialLinks: { docs: '/docs', console: '/dev-login' } as Prisma.InputJsonValue,
      },
      update: {},
    });

    const page = await this.prisma.cmsPage.upsert({
      where: { slug: 'home' },
      create: {
        slug: 'home',
        title: 'VerbaLab — Africa’s voice intelligence platform',
        description:
          'Speak, translate, and reason across African languages, accents, and cultures.',
        status: 'published',
        seo: {
          title: 'VerbaLab',
          description: "Africa's own AI voice, speech, and language platform.",
        } as Prisma.InputJsonValue,
      },
      update: {},
    });

    const blockCount = await this.prisma.cmsBlock.count({ where: { pageId: page.id } });
    if (blockCount === 0) {
      for (const block of DEFAULT_HOME_BLOCKS) {
        await this.prisma.cmsBlock.create({
          data: {
            pageId: page.id,
            type: block.type,
            sortOrder: block.sortOrder,
            content: block.content as unknown as Prisma.InputJsonValue,
            published: true,
          },
        });
      }
    }

    for (const asset of DEFAULT_ASSETS) {
      await this.prisma.cmsAsset.upsert({
        where: { key: asset.key },
        create: {
          pageId: page.id,
          key: asset.key,
          url: asset.url,
          alt: asset.alt,
          kind: asset.kind,
        },
        update: {
          url: asset.url,
          alt: asset.alt,
        },
      });
    }

    this.log.log('Marketing CMS seed ensured');
  }

  async getSettings() {
    await this.ensureSeeded();
    return this.prisma.cmsSiteSettings.findUniqueOrThrow({ where: { id: 'default' } });
  }

  async updateSettings(input: {
    brandName?: string;
    tagline?: string;
    defaultTheme?: string;
    primaryColor?: string;
    accentColor?: string;
    designScope?: Prisma.InputJsonValue;
    socialLinks?: Prisma.InputJsonValue;
  }) {
    return this.prisma.cmsSiteSettings.update({
      where: { id: 'default' },
      data: {
        ...(input.brandName != null ? { brandName: input.brandName } : {}),
        ...(input.tagline != null ? { tagline: input.tagline } : {}),
        ...(input.defaultTheme != null ? { defaultTheme: input.defaultTheme } : {}),
        ...(input.primaryColor != null ? { primaryColor: input.primaryColor } : {}),
        ...(input.accentColor != null ? { accentColor: input.accentColor } : {}),
        ...(input.designScope != null ? { designScope: input.designScope } : {}),
        ...(input.socialLinks != null ? { socialLinks: input.socialLinks } : {}),
      },
    });
  }

  async getPageBySlug(slug: string) {
    await this.ensureSeeded();
    const page = await this.prisma.cmsPage.findUnique({
      where: { slug },
      include: {
        blocks: { where: { published: true }, orderBy: { sortOrder: 'asc' } },
        assets: true,
      },
    });
    if (!page || page.status !== 'published') return null;
    const settings = await this.getSettings();
    const assetMap = Object.fromEntries(page.assets.map((a) => [a.key, a]));
    return { settings, page, assetMap };
  }

  async listPages() {
    await this.ensureSeeded();
    return this.prisma.cmsPage.findMany({
      orderBy: { slug: 'asc' },
      include: { _count: { select: { blocks: true, assets: true } } },
    });
  }

  async upsertBlock(input: {
    pageSlug: string;
    blockId?: string;
    type: string;
    sortOrder?: number;
    content: Prisma.InputJsonValue;
    published?: boolean;
  }) {
    const page = await this.prisma.cmsPage.findUnique({ where: { slug: input.pageSlug } });
    if (!page) throw new Error('page_not_found');
    if (input.blockId) {
      return this.prisma.cmsBlock.update({
        where: { id: input.blockId },
        data: {
          type: input.type,
          content: input.content,
          ...(input.sortOrder != null ? { sortOrder: input.sortOrder } : {}),
          ...(input.published != null ? { published: input.published } : {}),
        },
      });
    }
    return this.prisma.cmsBlock.create({
      data: {
        pageId: page.id,
        type: input.type,
        sortOrder: input.sortOrder ?? 100,
        content: input.content,
        published: input.published ?? true,
      },
    });
  }

  async upsertAsset(input: {
    pageSlug?: string;
    key: string;
    url: string;
    alt?: string;
    kind?: string;
  }) {
    const page = input.pageSlug
      ? await this.prisma.cmsPage.findUnique({ where: { slug: input.pageSlug } })
      : null;
    return this.prisma.cmsAsset.upsert({
      where: { key: input.key },
      create: {
        pageId: page?.id,
        key: input.key,
        url: input.url,
        alt: input.alt ?? '',
        kind: input.kind ?? 'image',
      },
      update: {
        url: input.url,
        alt: input.alt ?? '',
        kind: input.kind ?? 'image',
        pageId: page?.id,
      },
    });
  }

  async reseedHome() {
    const page = await this.prisma.cmsPage.findUnique({ where: { slug: 'home' } });
    if (!page) {
      await this.ensureSeeded();
      return this.getPageBySlug('home');
    }
    await this.prisma.cmsBlock.deleteMany({ where: { pageId: page.id } });
    for (const block of DEFAULT_HOME_BLOCKS) {
      await this.prisma.cmsBlock.create({
        data: {
          pageId: page.id,
          type: block.type,
          sortOrder: block.sortOrder,
          content: block.content as unknown as Prisma.InputJsonValue,
          published: true,
        },
      });
    }
    for (const asset of DEFAULT_ASSETS) {
      await this.prisma.cmsAsset.upsert({
        where: { key: asset.key },
        create: {
          pageId: page.id,
          key: asset.key,
          url: asset.url,
          alt: asset.alt,
          kind: asset.kind,
        },
        update: { url: asset.url, alt: asset.alt, pageId: page.id },
      });
    }
    await this.prisma.cmsSiteSettings.update({
      where: { id: 'default' },
      data: { designScope: DEFAULT_DESIGN_SCOPE as unknown as Prisma.InputJsonValue },
    });
    return this.getPageBySlug('home');
  }
}
