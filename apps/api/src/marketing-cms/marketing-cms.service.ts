import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  DEFAULT_ASSETS,
  DEFAULT_DESIGN_SCOPE,
  DEFAULT_HOME_BLOCKS,
} from './marketing-cms.catalog';
import { DEFAULT_CONTENT_PAGES, PRODUCT_PREFILLS } from './marketing-cms.pages';

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

  private async seedPageBlocks(
    pageId: string,
    blocks: Array<{ type: string; sortOrder: number; content: Record<string, unknown> }>,
    replace: boolean,
  ) {
    const count = await this.prisma.cmsBlock.count({ where: { pageId } });
    if (count > 0 && !replace) return;
    if (replace) {
      await this.prisma.cmsBlock.deleteMany({ where: { pageId } });
    }
    for (const block of blocks) {
      await this.prisma.cmsBlock.create({
        data: {
          pageId,
          type: block.type,
          sortOrder: block.sortOrder,
          content: block.content as Prisma.InputJsonValue,
          published: true,
        },
      });
    }
  }

  async ensureSeeded(opts?: { replaceHome?: boolean; replaceContentPages?: boolean }) {
    const existingSettings = await this.prisma.cmsSiteSettings.findUnique({ where: { id: 'default' } });
    const mergedDesignScope = {
      ...DEFAULT_DESIGN_SCOPE,
      ...((existingSettings?.designScope as Record<string, unknown> | null) ?? {}),
      northStar: DEFAULT_DESIGN_SCOPE.northStar,
      components: DEFAULT_DESIGN_SCOPE.components,
    };

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
      update: {
        designScope: mergedDesignScope as unknown as Prisma.InputJsonValue,
      },
    });

    const home = await this.prisma.cmsPage.upsert({
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
          reviewStatus: 'pending_review',
          kind: 'marketing_home',
        } as Prisma.InputJsonValue,
      },
      update: {},
    });

    // Backfill review metadata on home when older seeds omitted it.
    const homeSeo = (home.seo ?? {}) as Record<string, unknown>;
    if (!homeSeo.reviewStatus) {
      await this.prisma.cmsPage.update({
        where: { id: home.id },
        data: {
          seo: {
            ...homeSeo,
            title: homeSeo.title ?? 'VerbaLab',
            description:
              homeSeo.description ?? "Africa's own AI voice, speech, and language platform.",
            reviewStatus: 'pending_review',
            kind: 'marketing_home',
          } as Prisma.InputJsonValue,
        },
      });
    }

    const homeBlockCount = await this.prisma.cmsBlock.count({ where: { pageId: home.id } });
    const shouldReplaceHome =
      Boolean(opts?.replaceHome) || homeBlockCount < DEFAULT_HOME_BLOCKS.length;

    await this.seedPageBlocks(
      home.id,
      DEFAULT_HOME_BLOCKS.map((b) => ({
        type: b.type,
        sortOrder: b.sortOrder,
        content: b.content as unknown as Record<string, unknown>,
      })),
      shouldReplaceHome,
    );

    for (const pageSeed of DEFAULT_CONTENT_PAGES) {
      const page = await this.prisma.cmsPage.upsert({
        where: { slug: pageSeed.slug },
        create: {
          slug: pageSeed.slug,
          title: pageSeed.title,
          description: pageSeed.description,
          status: 'published',
          seo: {
            reviewStatus: pageSeed.reviewStatus,
            kind: pageSeed.slug.startsWith('use-case') ? 'use_case' : 'product_copy',
          } as Prisma.InputJsonValue,
        },
        update: {},
      });
      await this.seedPageBlocks(page.id, pageSeed.blocks, Boolean(opts?.replaceContentPages));
    }

    for (const asset of DEFAULT_ASSETS) {
      await this.prisma.cmsAsset.upsert({
        where: { key: asset.key },
        create: {
          pageId: home.id,
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

    // Keep footer / product hubs / product cards aligned with catalog without wiping custom blocks.
    await this.syncSeededBlockType(home.id, 'footer');
    await this.syncSeededBlockType(home.id, 'product_hubs');
    await this.syncSeededBlockType(home.id, 'products');

    this.log.log('Marketing CMS seed ensured (home + use-case + product prefills)');
  }

  private async syncSeededBlockType(pageId: string, type: string) {
    const seed = DEFAULT_HOME_BLOCKS.find((b) => b.type === type);
    if (!seed) return;
    const existing = await this.prisma.cmsBlock.findFirst({
      where: { pageId, type },
      orderBy: { sortOrder: 'asc' },
    });
    if (!existing) {
      await this.prisma.cmsBlock.create({
        data: {
          pageId,
          type: seed.type,
          sortOrder: seed.sortOrder,
          content: seed.content as unknown as Prisma.InputJsonValue,
          published: true,
        },
      });
      return;
    }
    const current = existing.content as {
      columns?: Array<{ title?: string; links?: Array<{ label?: string; href?: string; adminOnly?: boolean }> }>;
      tabs?: unknown[];
      items?: Array<{ title?: string; href?: string }>;
      brand?: string;
      blurb?: string;
      links?: unknown[];
    };
    const next = seed.content as {
      columns?: Array<{ title?: string; links?: Array<{ label?: string; href?: string; adminOnly?: boolean }> }>;
      tabs?: unknown[];
      items?: Array<{ title?: string; href?: string }>;
      brand?: string;
      blurb?: string;
      links?: unknown[];
    };
    // Additive-only sync: never wipe admin edits — only fill in when catalog grew,
    // or refresh known product hrefs to dedicated /products/* SEO landers.
    const needsFooterSync =
      type === 'footer' && (current.columns?.length ?? 0) < (next.columns?.length ?? 0);
    const needsHubsSync =
      type === 'product_hubs' && (current.tabs?.length ?? 0) < (next.tabs?.length ?? 0);

    if (type === 'footer' && current.columns?.length && next.columns?.length) {
      const hrefByLabel = new Map<string, string>();
      for (const col of next.columns) {
        for (const link of col.links ?? []) {
          if (link.label && link.href) hrefByLabel.set(link.label, link.href);
        }
      }
      let changed = false;
      const mergedColumns = current.columns.map((col) => ({
        ...col,
        links: (col.links ?? []).map((link) => {
          const nextHref = link.label ? hrefByLabel.get(link.label) : undefined;
          if (nextHref && nextHref !== link.href) {
            changed = true;
            return { ...link, href: nextHref };
          }
          return link;
        }),
      }));
      if (changed) {
        await this.prisma.cmsBlock.update({
          where: { id: existing.id },
          data: {
            content: {
              ...current,
              columns: mergedColumns,
            } as unknown as Prisma.InputJsonValue,
          },
        });
        return;
      }
    }

    if (type === 'products' && current.items?.length && next.items?.length) {
      const hrefByTitle = new Map(
        next.items.filter((i) => i.title && i.href).map((i) => [i.title as string, i.href as string]),
      );
      let changed = false;
      const mergedItems = current.items.map((item) => {
        const nextHref = item.title ? hrefByTitle.get(item.title) : undefined;
        if (nextHref && nextHref !== item.href) {
          changed = true;
          return { ...item, href: nextHref };
        }
        return item;
      });
      if (changed) {
        await this.prisma.cmsBlock.update({
          where: { id: existing.id },
          data: {
            content: {
              ...current,
              items: mergedItems,
            } as unknown as Prisma.InputJsonValue,
          },
        });
        return;
      }
    }

    if (needsFooterSync || needsHubsSync) {
      await this.prisma.cmsBlock.update({
        where: { id: existing.id },
        data: { content: seed.content as unknown as Prisma.InputJsonValue },
      });
    }
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

  async setReviewStatus(slug: string, reviewStatus: 'pending_review' | 'approved') {
    const page = await this.prisma.cmsPage.findUnique({ where: { slug } });
    if (!page) throw new Error('page_not_found');
    const seo = (page.seo ?? {}) as Record<string, unknown>;
    return this.prisma.cmsPage.update({
      where: { slug },
      data: {
        seo: { ...seo, reviewStatus } as Prisma.InputJsonValue,
      },
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

  async getPrefill(surface: keyof typeof PRODUCT_PREFILLS) {
    await this.ensureSeeded();
    const slug = `product-${surface}`;
    const page = await this.prisma.cmsPage.findUnique({
      where: { slug },
      include: { blocks: { where: { type: 'product_prefill', published: true }, take: 1 } },
    });
    const fromCms = page?.blocks[0]?.content as Record<string, unknown> | undefined;
    const fallback = PRODUCT_PREFILLS[surface];
    return {
      surface,
      pageSlug: slug,
      reviewStatus:
        ((page?.seo as Record<string, unknown> | null)?.reviewStatus as string) ?? 'pending_review',
      prefill: { ...fallback, ...(fromCms ?? {}) },
    };
  }

  async reseedHome() {
    await this.ensureSeeded({ replaceHome: false, replaceContentPages: false });
    // Refresh home only when still pending review — approved homepage/footer edits stay.
    const homePage = await this.prisma.cmsPage.findUnique({ where: { slug: 'home' } });
    const homeReview = (homePage?.seo as Record<string, unknown> | null)?.reviewStatus;
    if (homePage && homeReview !== 'approved') {
      await this.ensureSeeded({ replaceHome: true, replaceContentPages: false });
    }
    // Always refresh content pages that are still pending_review (safe for admin edits that were approved).
    for (const pageSeed of DEFAULT_CONTENT_PAGES) {
      const page = await this.prisma.cmsPage.findUnique({ where: { slug: pageSeed.slug } });
      if (!page) continue;
      const status = (page.seo as Record<string, unknown> | null)?.reviewStatus;
      if (status === 'approved') continue;
      await this.seedPageBlocks(page.id, pageSeed.blocks, true);
      await this.prisma.cmsPage.update({
        where: { id: page.id },
        data: {
          title: pageSeed.title,
          description: pageSeed.description,
          seo: {
            reviewStatus: 'pending_review',
            kind: pageSeed.slug.startsWith('use-case') ? 'use_case' : 'product_copy',
          } as Prisma.InputJsonValue,
        },
      });
    }
    return {
      home: await this.getPageBySlug('home'),
      pages: await this.listPages(),
    };
  }
}
