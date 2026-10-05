#!/usr/bin/env python3
"""Generate VerbaLab Volume 23 AI Economy / AIE (VL-374–383).

Internal marketplace/commerce platform: commerce catalogs, licensing ledger,
revenue-share workflows, talent marketplace, grant tracking, community,
investment *dashboard* (not a funding portal), and economic intelligence.

Honesty (README Volume 23):
  internalMarketplaceSoftware=true
  worldsLargestAiEconomy=false
  handRolledCardHandling=false
  usesExistingBillingProcessor=true
  autonomousPayouts=false
  revenueShareLedgerOnly=true
  fundingPortalOs=false
  securitiesOfferingOs=false
  investmentDashboardOnly=true
"""

from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path("/workspace/verbalab")
SRC = ROOT / "apps/api/src"
WEB = ROOT / "apps/web"


def to_pascal(slug: str) -> str:
    return "".join(p[:1].upper() + p[1:] for p in slug.split("-"))


def to_camel(slug: str) -> str:
    p = to_pascal(slug)
    return p[:1].lower() + p[1:]


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not content.endswith("\n"):
        content += "\n"
    path.write_text(content, encoding="utf-8")


def insert_after(text: str, anchor: str, addition: str) -> str:
    if addition.strip() and addition.strip() in text:
        return text
    idx = text.find(anchor)
    if idx == -1:
        raise RuntimeError(f"anchor not found: {anchor[:100]!r}")
    at = idx + len(anchor)
    return text[:at] + addition + text[at:]


HUBS = [
    {
        "slug": "ai-economy",
        "vl": 374,
        "phase": 241,
        "adr": "0277",
        "title": "AI Economy",
        "kind": "foundation",
        "doc": "AI_ECONOMY.md",
        "nav": "AI Economy",
        "domain": "foundation",
        "note": "VL-374 AIE foundation. worldsLargestAiEconomy=false; marketplace software only.",
    },
    {
        "slug": "ai-commerce-platform",
        "vl": 375,
        "phase": 242,
        "adr": "0278",
        "title": "AI Commerce Platform",
        "kind": "domain",
        "doc": "AI_COMMERCE_PLATFORM.md",
        "nav": "AI Commerce",
        "domain": "commerce",
        "note": "VL-375 Catalogs/subscriptions/invoices via existing Stripe billing — no hand-rolled card handling.",
        "kinds": [
            ("product", "AI Product Listing"),
            ("subscription_plan", "Subscription Plan"),
            ("usage_meter", "Usage Meter"),
            ("marketplace_listing", "Marketplace Listing"),
            ("invoice_draft", "Invoice Draft"),
            ("enterprise_contract", "Enterprise Contract"),
            ("payment_intent_ref", "Payment Intent Reference"),
            ("checkout_session_ref", "Checkout Session Reference"),
        ],
    },
    {
        "slug": "ai-licensing-platform",
        "vl": 376,
        "phase": 243,
        "adr": "0279",
        "title": "AI Licensing Platform",
        "kind": "domain",
        "doc": "AI_LICENSING_PLATFORM.md",
        "nav": "AI Licensing",
        "domain": "licensing",
        "note": "VL-376 License entitlement ledger for models/datasets/voice/translation — not legal counsel.",
        "kinds": [
            ("model_license", "Model License"),
            ("dataset_license", "Dataset License"),
            ("prompt_license", "Prompt License"),
            ("voice_license", "Voice License"),
            ("translation_license", "Translation License"),
            ("enterprise_license", "Enterprise License"),
            ("entitlement", "Entitlement"),
            ("license_audit", "License Audit Event"),
        ],
    },
    {
        "slug": "revenue-sharing-platform",
        "vl": 377,
        "phase": 244,
        "adr": "0280",
        "title": "Revenue Sharing Platform",
        "kind": "domain",
        "doc": "REVENUE_SHARING_PLATFORM.md",
        "nav": "Revenue Share",
        "domain": "revenue",
        "note": "VL-377 Royalty/payout ledger + workflow. autonomousPayouts=false; finance/legal set terms.",
        "kinds": [
            ("creator_share", "Creator Share Rule"),
            ("partner_share", "Partner Share Rule"),
            ("researcher_share", "Researcher Share Rule"),
            ("university_share", "University Share Rule"),
            ("government_program", "Government Program Share"),
            ("royalty_accrual", "Royalty Accrual"),
            ("payout_request", "Payout Request"),
            ("payout_batch", "Payout Batch"),
        ],
    },
    {
        "slug": "ai-talent-platform",
        "vl": 378,
        "phase": 245,
        "adr": "0281",
        "title": "AI Talent Platform",
        "kind": "domain",
        "doc": "AI_TALENT_PLATFORM.md",
        "nav": "AI Talent",
        "domain": "talent",
        "note": "VL-378 Marketplace matching for linguists/voice artists/translators/annotators — contracts still human.",
        "kinds": [
            ("linguist", "Linguist Profile"),
            ("voice_artist", "Voice Artist Profile"),
            ("translator", "Translator Profile"),
            ("annotator", "Annotator Profile"),
            ("researcher", "Researcher Profile"),
            ("developer", "Developer Profile"),
            ("engagement", "Talent Engagement"),
            ("assignment", "Work Assignment"),
        ],
    },
    {
        "slug": "research-funding-platform",
        "vl": 379,
        "phase": 246,
        "adr": "0282",
        "title": "Research Funding Platform",
        "kind": "domain",
        "doc": "RESEARCH_FUNDING_PLATFORM.md",
        "nav": "Research Funding",
        "domain": "funding",
        "note": "VL-379 Grant/scholarship/innovation funding *tracking* — not autonomous grant disbursement.",
        "kinds": [
            ("grant", "Grant"),
            ("scholarship", "Scholarship"),
            ("innovation_fund", "Innovation Funding"),
            ("research_award", "Research Award"),
            ("university_funding", "University Funding"),
            ("startup_funding", "Startup Funding Track"),
            ("application", "Funding Application"),
            ("milestone", "Funding Milestone"),
        ],
    },
    {
        "slug": "global-community-platform",
        "vl": 380,
        "phase": 247,
        "adr": "0283",
        "title": "Global Community Platform",
        "kind": "domain",
        "doc": "GLOBAL_COMMUNITY_PLATFORM.md",
        "nav": "Community",
        "domain": "community",
        "note": "VL-380 Forums/events/hackathons/open-source community tooling.",
        "kinds": [
            ("forum", "Forum"),
            ("event", "Event"),
            ("hackathon", "Hackathon"),
            ("research_challenge", "Research Challenge"),
            ("open_source", "Open Source Project"),
            ("developer_community", "Developer Community"),
            ("language_community", "Language Community"),
            ("meetup", "Meetup"),
        ],
    },
    {
        "slug": "ai-investment-platform",
        "vl": 381,
        "phase": 248,
        "adr": "0284",
        "title": "AI Investment Platform",
        "kind": "domain",
        "doc": "AI_INVESTMENT_PLATFORM.md",
        "nav": "Investment Dash",
        "domain": "investment",
        "note": "VL-381 Investment *dashboard/reporting only*. fundingPortalOs=false; securitiesOfferingOs=false.",
        "kinds": [
            ("startup_investment", "Startup Investment Record"),
            ("research_investment", "Research Investment Record"),
            ("university_investment", "University Investment Record"),
            ("government_project", "Government Project Funding Record"),
            ("partner_funding", "Partner Funding Record"),
            ("portfolio_snapshot", "Portfolio Snapshot"),
            ("committee_note", "Investment Committee Note"),
            ("dashboard_kpi", "Investment Dashboard KPI"),
        ],
    },
    {
        "slug": "economic-intelligence",
        "vl": 382,
        "phase": 249,
        "adr": "0285",
        "title": "Economic Intelligence",
        "kind": "domain",
        "doc": "ECONOMIC_INTELLIGENCE.md",
        "nav": "Econ Intel",
        "domain": "intelligence",
        "note": "VL-382 Executive/adoption/revenue analytics dashboards — reporting tooling.",
        "kinds": [
            ("gdp_impact", "GDP Impact Metric"),
            ("language_preservation", "Language Preservation Metric"),
            ("developer_growth", "Developer Growth Metric"),
            ("partner_growth", "Partner Growth Metric"),
            ("marketplace_revenue", "Marketplace Revenue Metric"),
            ("research_output", "Research Output Metric"),
            ("country_adoption", "Country Adoption Metric"),
            ("enterprise_adoption", "Enterprise Adoption Metric"),
        ],
    },
]

HONESTY = """{
    internalMarketplaceSoftware: true,
    worldsLargestAiEconomy: false,
    handRolledCardHandling: false,
    usesExistingBillingProcessor: true,
    autonomousPayouts: false,
    revenueShareLedgerOnly: true,
    fundingPortalOs: false,
    securitiesOfferingOs: false,
    investmentDashboardOnly: true,
    note:
      'Volume 23 README: VerbaLab marketplace/commerce software. Not the world\\'s largest AI economy; no hand-rolled cards; payouts/investments are ledger/dashboard only — finance/legal decide real money movement.',
  }"""


def copy_roadmap() -> None:
    dest = ROOT / "docs/roadmap/volume23-ai-economy"
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(Path("/tmp/v23"), dest)


def ensure_prisma() -> None:
    schema = ROOT / "apps/api/prisma/schema.prisma"
    text = schema.read_text()
    if "model AieRecord" not in text:
        model = """
/// Volume 23 AI Economy records (marketplace/commerce/ledger/dashboard).
/// Not evidence of world-largest economy status, funding-portal operation, or autonomous payouts.
model AieRecord {
  id             String   @id @default(cuid())
  organizationId String   @map("organization_id")
  domain         String
  kind           String
  title          String
  status         String   @default("active")
  summary        String   @default("")
  content        Json     @default("{}")
  ownerLabel     String?  @map("owner_label")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@index([organizationId, domain])
  @@index([organizationId, kind])
  @@index([organizationId, status])
  @@map("aie_records")
}
"""
        text = text.rstrip() + "\n" + model + "\n"
        schema.write_text(text)

    mig = ROOT / "apps/api/prisma/migrations/20261003290000_aie/migration.sql"
    if not mig.exists():
        write(
            mig,
            """-- Volume 23 AI Economy records
CREATE TABLE IF NOT EXISTS "aie_records" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "summary" TEXT NOT NULL DEFAULT '',
    "content" JSONB NOT NULL DEFAULT '{}',
    "owner_label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aie_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "aie_records_organization_id_domain_idx" ON "aie_records"("organization_id", "domain");
CREATE INDEX IF NOT EXISTS "aie_records_organization_id_kind_idx" ON "aie_records"("organization_id", "kind");
CREATE INDEX IF NOT EXISTS "aie_records_organization_id_status_idx" ON "aie_records"("organization_id", "status");
""",
        )


def write_aie_store() -> None:
    base = SRC / "aie-store"
    write(
        base / "aie-honesty.ts",
        f"""/**
 * Shared AI Economy honesty flags (Volume 23 README).
 */
export function aieHonesty() {{
  return {HONESTY};
}}
""",
    )
    write(
        base / "aie-store.seed.ts",
        """export type AieSeed = {
  domain: string;
  kind: string;
  title: string;
  status: string;
  summary: string;
  ownerLabel: string;
  content: Record<string, unknown>;
};

export function aieDefaultSeeds(): AieSeed[] {
  return [
    { domain: 'foundation', kind: 'ecosystem_map', title: 'AI Economy ecosystem map (VerbaLab)', status: 'active', summary: 'Internal map of marketplace, licensing, talent, community, and intelligence hubs.', ownerLabel: 'Economy Office (role)', content: { worldsLargestAiEconomy: false } },
    { domain: 'commerce', kind: 'product', title: 'Listing — African Language STT API', status: 'active', summary: 'Catalog row for STT product; checkout via existing Stripe billing.', ownerLabel: 'Commerce (role)', content: { processor: 'stripe', handRolledCardHandling: false } },
    { domain: 'commerce', kind: 'subscription_plan', title: 'Plan — Voice Studio Pro (catalog)', status: 'active', summary: 'Subscription catalog entry; billed through Volume 11 Monetization Cloud / Stripe.', ownerLabel: 'Commerce (role)', content: { usesExistingBillingProcessor: true } },
    { domain: 'licensing', kind: 'voice_license', title: 'License — Voice clone commercial (template)', status: 'draft', summary: 'Entitlement template for commercial voice use with consent gates.', ownerLabel: 'Licensing (role)', content: { requiresConsent: true } },
    { domain: 'licensing', kind: 'dataset_license', title: 'License — Yoruba speech dataset research', status: 'active', summary: 'Research-use dataset entitlement record.', ownerLabel: 'Licensing (role)', content: { use: 'research' } },
    { domain: 'revenue', kind: 'royalty_accrual', title: 'Accrual — Voice artist share (demo)', status: 'pending_review', summary: 'Ledger accrual awaiting finance approval. autonomousPayouts=false.', ownerLabel: 'Finance (role)', content: { amountUsd: 0, autonomousPayouts: false } },
    { domain: 'revenue', kind: 'payout_request', title: 'Payout request — partner royalty (demo)', status: 'draft', summary: 'Workflow record only; Stripe Connect / tax reporting need human + provider.', ownerLabel: 'Finance (role)', content: { revenueShareLedgerOnly: true } },
    { domain: 'talent', kind: 'linguist', title: 'Talent — Swahili linguist (sample)', status: 'active', summary: 'Marketplace profile for language specialist matching.', ownerLabel: 'Talent Ops (role)', content: { languages: ['sw'] } },
    { domain: 'talent', kind: 'voice_artist', title: 'Talent — Yoruba voice artist (sample)', status: 'active', summary: 'Voice artist profile for consented recording work.', ownerLabel: 'Talent Ops (role)', content: { languages: ['yo'] } },
    { domain: 'funding', kind: 'grant', title: 'Grant track — African STT research (sample)', status: 'open', summary: 'Grant tracking record — disbursement outside autonomous code.', ownerLabel: 'Research Office (role)', content: { trackingOnly: true } },
    { domain: 'funding', kind: 'scholarship', title: 'Scholarship — Language tech fellows (sample)', status: 'active', summary: 'Scholarship program tracking.', ownerLabel: 'Research Office (role)', content: { trackingOnly: true } },
    { domain: 'community', kind: 'hackathon', title: 'Event — African Voice Hackathon (sample)', status: 'planned', summary: 'Community hackathon listing.', ownerLabel: 'Community (role)', content: { region: 'Africa' } },
    { domain: 'community', kind: 'language_community', title: 'Community — Amharic builders', status: 'active', summary: 'Language community hub listing.', ownerLabel: 'Community (role)', content: { language: 'am' } },
    { domain: 'investment', kind: 'portfolio_snapshot', title: 'Portfolio snapshot — strategic partners (dashboard)', status: 'active', summary: 'Reporting-only investment dashboard row. fundingPortalOs=false.', ownerLabel: 'Investment Committee (role)', content: { fundingPortalOs: false, securitiesOfferingOs: false, investmentDashboardOnly: true } },
    { domain: 'investment', kind: 'startup_investment', title: 'Record — Language startup partnership (offline deal)', status: 'tracked', summary: 'Tracks an investment made through normal legal/financial channels — not executed in-app.', ownerLabel: 'Investment Committee (role)', content: { executedInApp: false } },
    { domain: 'intelligence', kind: 'marketplace_revenue', title: 'Metric — Marketplace GMV (demo)', status: 'active', summary: 'Executive dashboard metric placeholder.', ownerLabel: 'Economy Analytics', content: { value: 0, currency: 'USD' } },
    { domain: 'intelligence', kind: 'language_preservation', title: 'Metric — Languages with active talent (demo)', status: 'active', summary: 'Language preservation proxy metric.', ownerLabel: 'Economy Analytics', content: { value: 3 } },
    { domain: 'intelligence', kind: 'country_adoption', title: 'Metric — Countries with partners (demo)', status: 'active', summary: 'Country adoption dashboard metric.', ownerLabel: 'Economy Analytics', content: { value: 4 } },
  ];
}
""",
    )
    write(
        base / "aie-store.service.ts",
        """import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { aieHonesty } from './aie-honesty';
import { aieDefaultSeeds } from './aie-store.seed';

const DEMO_ORG = 'org_verbalab_demo';

@Injectable()
export class AieStoreService implements OnModuleInit {
  private readonly log = new Logger(AieStoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureSeeded(DEMO_ORG);
    } catch (err) {
      this.log.warn(`AIE seed skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async ensureSeeded(organizationId: string) {
    const count = await this.prisma.aieRecord.count({ where: { organizationId } });
    if (count > 0) {
      for (const seed of aieDefaultSeeds()) {
        const existing = await this.prisma.aieRecord.findFirst({
          where: { organizationId, domain: seed.domain, kind: seed.kind, title: seed.title },
        });
        if (!existing) {
          await this.prisma.aieRecord.create({
            data: {
              organizationId,
              domain: seed.domain,
              kind: seed.kind,
              title: seed.title,
              status: seed.status,
              summary: seed.summary,
              ownerLabel: seed.ownerLabel,
              content: seed.content as Prisma.InputJsonValue,
            },
          });
        }
      }
      const next = await this.prisma.aieRecord.count({ where: { organizationId } });
      return { seeded: false, count: next };
    }
    for (const seed of aieDefaultSeeds()) {
      await this.prisma.aieRecord.create({
        data: {
          organizationId,
          domain: seed.domain,
          kind: seed.kind,
          title: seed.title,
          status: seed.status,
          summary: seed.summary,
          ownerLabel: seed.ownerLabel,
          content: seed.content as Prisma.InputJsonValue,
        },
      });
    }
    const next = await this.prisma.aieRecord.count({ where: { organizationId } });
    this.log.log(`AIE seeded ${next} records for ${organizationId}`);
    return { seeded: true, count: next };
  }

  list(organizationId: string, domain?: string) {
    return this.prisma.aieRecord.findMany({
      where: { organizationId, ...(domain ? { domain } : {}) },
      orderBy: [{ domain: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  async create(
    organizationId: string,
    input: {
      domain: string;
      kind: string;
      title: string;
      status?: string;
      summary?: string;
      ownerLabel?: string;
      content?: Record<string, unknown>;
    },
  ) {
    return this.prisma.aieRecord.create({
      data: {
        organizationId,
        domain: input.domain,
        kind: input.kind,
        title: input.title,
        status: input.status ?? 'active',
        summary: input.summary ?? '',
        ownerLabel: input.ownerLabel,
        content: (input.content ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async summary(organizationId: string) {
    await this.ensureSeeded(organizationId);
    const rows = await this.list(organizationId);
    const byDomain: Record<string, number> = {};
    for (const row of rows) byDomain[row.domain] = (byDomain[row.domain] ?? 0) + 1;
    return {
      organizationId,
      total: rows.length,
      byDomain,
      ...aieHonesty(),
    };
  }
}
""",
    )
    write(
        base / "aie-store.module.ts",
        """import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AieStoreService } from './aie-store.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AieStoreService],
  exports: [AieStoreService],
})
export class AieStoreModule {}
""",
    )


def write_foundation() -> None:
    hub = HUBS[0]
    slug = hub["slug"]
    base = SRC / slug
    products = []
    for h in HUBS:
        products.append(
            f"""    {{
      id: '{h["slug"]}',
      name: '{h["title"]}',
      status: 'shipped' as const,
      api: 'GET /v1/{h["slug"]}/{"products" if h["kind"] == "foundation" else "engine"}',
      console: '/{h["slug"]}',
      notes: {h["note"]!r},
    }}"""
        )
    products.append(
        """    {
      id: 'investment-dashboard-guard',
      name: 'Investment Dashboard Guard',
      status: 'shipped' as const,
      api: 'GET /v1/ai-investment-platform/engine',
      console: '/ai-investment-platform',
      notes: 'fundingPortalOs=false; securitiesOfferingOs=false; reporting only.',
    }"""
    )
    product_rows = ",\n".join(products)
    write(
        base / f"{slug}.catalog.ts",
        f"""import {{ aieHonesty }} from '../aie-store/aie-honesty';

export type AieProductRow = {{
  id: string;
  name: string;
  status: 'shipped' | 'partial' | 'deferred';
  api: string | null;
  console: string | null;
  notes: string;
}};

export function aiEconomyProductCatalog(): AieProductRow[] {{
  return [
{product_rows}
  ];
}}

export function aiEconomyHonesty() {{
  return aieHonesty();
}}

export function aiEconomyLibrary() {{
  return [
    {{ id: 'marketplace', title: 'Developer & Partner Marketplace' }},
    {{ id: 'licensing', title: 'Licensing Engine' }},
    {{ id: 'billing', title: 'Subscriptions & Usage Billing (Stripe)' }},
    {{ id: 'revenue_share', title: 'Revenue Share Ledger' }},
    {{ id: 'talent', title: 'Talent Marketplace' }},
    {{ id: 'funding_track', title: 'Research Funding Tracking' }},
    {{ id: 'community', title: 'Community Platform' }},
    {{ id: 'investment_dash', title: 'Investment Dashboard (not a funding portal)' }},
    {{ id: 'econ_intel', title: 'Economic Intelligence' }},
  ];
}}

export function aiEconomyRoutingTable() {{
  return [
    {{ id: 'products', path: '/v1/ai-economy/products', purpose: 'AIE product catalog' }},
    {{ id: 'overview', path: '/v1/ai-economy/overview', purpose: 'Authenticated overview' }},
    {{ id: 'records', path: '/v1/ai-economy/records', purpose: 'All AIE records' }},
    {{ id: 'monitoring', path: '/v1/ai-economy/monitoring', purpose: 'Monitoring snapshot' }},
    {{ id: 'guards', path: '/v1/ai-economy/guards', purpose: 'Money/securities honesty guards' }},
  ];
}}
""",
    )
    write(
        base / f"{slug}.service.ts",
        """import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { UsageService } from '../usage/usage.service';
import { AieStoreService } from '../aie-store/aie-store.service';
import { aieHonesty } from '../aie-store/aie-honesty';
import {
  aiEconomyHonesty,
  aiEconomyLibrary,
  aiEconomyProductCatalog,
  aiEconomyRoutingTable,
} from './ai-economy.catalog';

@Injectable()
export class AiEconomyService {
  constructor(
    private readonly usage: UsageService,
    private readonly store: AieStoreService,
  ) {}

  products() {
    return {
      product: 'VerbaLab AI Economy',
      products: aiEconomyProductCatalog(),
      library: aiEconomyLibrary(),
      honesty: aiEconomyHonesty(),
      safety: {
        ...aiEconomyHonesty(),
        note: 'Marketplace/commerce software — not world-largest economy status; Stripe for payments; investment dashboard only.',
      },
      docs: '/docs/AI_ECONOMY.md',
      note: 'AI Economy Foundation (VL-374). worldsLargestAiEconomy=false.',
    };
  }

  routing() {
    return {
      routes: aiEconomyRoutingTable(),
      products: aiEconomyProductCatalog().map((p) => ({ id: p.id, status: p.status, api: p.api })),
      honesty: aiEconomyHonesty(),
      note: 'Static AIE discovery catalog.',
      docs: '/docs/AI_ECONOMY.md',
    };
  }

  guards() {
    return {
      product: 'VerbaLab AI Economy Guards',
      honesty: aieHonesty(),
      rules: [
        'Do not hand-roll card/PAN handling — use existing Stripe / Monetization Cloud.',
        'Revenue share and payouts are ledger/workflow records; autonomousPayouts=false.',
        'AI Investment Platform is a dashboard/reporting tool only — not a funding portal.',
        'Tax/1099 and securities structuring require human finance/legal — not this code.',
      ],
      docs: '/docs/aie-audit/PRODUCTION_READINESS.md',
      note: 'Volume 23 money/securities honesty guards.',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    const aie = await this.store.summary(session.organizationId);
    return {
      session: { organizationId: session.organizationId, workspaceId: session.workspaceId, role: session.role },
      usage: { periodStart: usageSummary.periodStart, chat: usageSummary.chat, embeddings: usageSummary.embeddings },
      products: aiEconomyProductCatalog(),
      library: aiEconomyLibrary(),
      aie,
      honesty: aiEconomyHonesty(),
      links: Object.fromEntries(aiEconomyProductCatalog().filter((p) => p.console).map((p) => [p.id, p.console])),
      docs: '/docs/AI_ECONOMY.md',
      note: 'AIE overview (VL-374-383).',
    };
  }

  async records(session: SessionContext, domain?: string) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, domain);
    return { domain: domain ?? 'all', count: rows.length, records: rows, honesty: aiEconomyHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { domain: string; kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, body);
    return { record: row, honesty: aiEconomyHonesty() };
  }

  monitoring() {
    return {
      mode: 'foundation',
      products: aiEconomyProductCatalog().map((p) => ({ id: p.id, status: p.status })),
      honesty: aiEconomyHonesty(),
      note: 'AIE monitoring snapshot (VL-374).',
    };
  }
}
""",
    )
    write(
        base / f"{slug}.controller.ts",
        """import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard, SessionContext } from '../common/guards/clerk-auth.guard';
import { CurrentSession } from '../common/decorators/auth.decorators';
import { AiEconomyService } from './ai-economy.service';

@Controller('v1/ai-economy')
export class AiEconomyController {
  constructor(private readonly aie: AiEconomyService) {}

  @Get('products')
  products() { return this.aie.products(); }

  @Get('engine')
  engine() { return this.aie.products(); }

  @Get('routing')
  routing() { return this.aie.routing(); }

  @Get('guards')
  guards() { return this.aie.guards(); }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) { return this.aie.overview(session); }

  @Get('records')
  @UseGuards(ClerkAuthGuard)
  records(@CurrentSession() session: SessionContext, @Query('domain') domain?: string) {
    return this.aie.records(session, domain);
  }

  @Post('records')
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Body() body: { domain: string; kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    return this.aie.createRecord(session, body);
  }

  @Get('monitoring')
  monitoring() { return this.aie.monitoring(); }
}
""",
    )
    write(
        base / f"{slug}.module.ts",
        """import { Module } from '@nestjs/common';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { AieStoreModule } from '../aie-store/aie-store.module';
import { AiEconomyController } from './ai-economy.controller';
import { AiEconomyService } from './ai-economy.service';

@Module({
  imports: [UsageModule, IdentityModule, AieStoreModule],
  controllers: [AiEconomyController],
  providers: [AiEconomyService],
  exports: [AiEconomyService],
})
export class AiEconomyModule {}
""",
    )
    write_application_layer(hub)


def write_application_layer(hub: dict) -> None:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    camel = to_camel(slug)
    app = SRC / slug / "application"
    write(app / "messages.ts", f"export class Get{pascal}EngineQuery {{}}\n\nexport class List{pascal}ProductsQuery {{}}\n")
    write(app / "ports.ts", f"export interface {pascal}EnginePort {{\n  engine(): Promise<Record<string, unknown>> | Record<string, unknown>;\n}}\n")
    write(
        app / "handlers.ts",
        f"""import {{ Injectable }} from '@nestjs/common';
import {{ IQueryHandler, QueryHandler }} from '@nestjs/cqrs';
import {{ {pascal}Service }} from '../{slug}.service';
import {{ Get{pascal}EngineQuery, List{pascal}ProductsQuery }} from './messages';

@Injectable()
@QueryHandler(Get{pascal}EngineQuery)
export class Get{pascal}EngineHandler implements IQueryHandler<Get{pascal}EngineQuery> {{
  constructor(private readonly service: {pascal}Service) {{}}
  execute() {{
    return this.service.{"products" if hub["kind"] == "foundation" else "engine"}();
  }}
}}

@Injectable()
@QueryHandler(List{pascal}ProductsQuery)
export class List{pascal}ProductsHandler implements IQueryHandler<List{pascal}ProductsQuery> {{
  constructor(private readonly service: {pascal}Service) {{}}
  execute() {{
    return this.service.products();
  }}
}}
""",
    )
    write(
        app / f"nest-{slug}.adapter.ts",
        f"""import {{ Injectable }} from '@nestjs/common';
import {{ {pascal}Service }} from '../{slug}.service';
import {{ {pascal}EnginePort }} from './ports';

@Injectable()
export class Nest{pascal}Adapter implements {pascal}EnginePort {{
  constructor(private readonly service: {pascal}Service) {{}}
  engine() {{
    return this.service.{"products" if hub["kind"] == "foundation" else "engine"}();
  }}
}}
""",
    )
    write(
        app / f"{slug}-application.module.ts",
        f"""import {{ Module }} from '@nestjs/common';
import {{ CqrsModule }} from '@nestjs/cqrs';
import {{ {pascal}Module }} from '../{slug}.module';
import {{ Get{pascal}EngineHandler, List{pascal}ProductsHandler }} from './handlers';
import {{ Nest{pascal}Adapter }} from './nest-{slug}.adapter';

@Module({{
  imports: [CqrsModule, {pascal}Module],
  providers: [Get{pascal}EngineHandler, List{pascal}ProductsHandler, Nest{pascal}Adapter],
  exports: [Nest{pascal}Adapter],
}})
export class {pascal}ApplicationModule {{}}
""",
    )


def write_domain(hub: dict) -> None:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    domain = hub["domain"]
    kinds = hub.get("kinds", [])
    caps = ",\n".join(
        f"    {{ id: '{k}', name: '{label}', status: 'shipped', api: 'GET /v1/{slug}/records', notes: '{label}.' }}"
        for k, label in kinds
    )
    write(
        SRC / slug / f"{slug}.catalog.ts",
        f"""import {{ aieHonesty }} from '../aie-store/aie-honesty';

export function {to_camel(slug)}Honesty() {{
  return aieHonesty();
}}

export function {to_camel(slug)}Capabilities() {{
  return [
{caps}
  ];
}}

export function {to_camel(slug)}RoutesTo() {{
  return [
    {{ module: 'ai-economy', path: '/v1/ai-economy/products', role: 'AIE Foundation' }},
    {{ module: 'global-ai-standards', path: '/v1/global-ai-standards/products', role: 'VGAS (Vol 22)' }},
    {{ module: 'billing', path: '/v1/billing', role: 'Monetization / Stripe (Vol 11)' }},
  ];
}}
""",
    )
    extra_engine = ""
    if slug == "ai-investment-platform":
        extra_engine = """
      investmentMode: 'dashboard_reporting_only',
      fundingPortalOs: false,
      securitiesOfferingOs: false,
"""
    write(
        SRC / slug / f"{slug}.service.ts",
        f"""import {{ Injectable }} from '@nestjs/common';
import {{ SessionContext }} from '../common/guards/clerk-auth.guard';
import {{ AieStoreService }} from '../aie-store/aie-store.service';
import {{
  {to_camel(slug)}Capabilities,
  {to_camel(slug)}Honesty,
  {to_camel(slug)}RoutesTo,
}} from './{slug}.catalog';

@Injectable()
export class {pascal}Service {{
  constructor(private readonly store: AieStoreService) {{}}

  engine() {{
    return {{
      product: 'VerbaLab {hub["title"]}',
      domain: '{domain}',
      capabilities: {to_camel(slug)}Capabilities(),
      routesTo: {to_camel(slug)}RoutesTo(),
{extra_engine}      honesty: {to_camel(slug)}Honesty(),
      safety: {{
        ...{to_camel(slug)}Honesty(),
        note: {hub["note"]!r},
      }},
      docs: '/docs/{hub["doc"]}',
      note: {hub["note"]!r},
    }};
  }}

  products() {{ return this.engine(); }}

  monitoring() {{
    return {{
      mode: 'domain',
      domain: '{domain}',
      capabilities: {to_camel(slug)}Capabilities().map((c) => ({{ id: c.id, status: c.status }})),
      honesty: {to_camel(slug)}Honesty(),
      note: '{hub["title"]} monitoring (VL-{hub["vl"]}).',
    }};
  }}

  routes() {{
    return {{ routesTo: {to_camel(slug)}RoutesTo(), honesty: {to_camel(slug)}Honesty() }};
  }}

  async records(session: SessionContext) {{
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, '{domain}');
    return {{ domain: '{domain}', count: rows.length, records: rows, honesty: {to_camel(slug)}Honesty() }};
  }}

  async createRecord(
    session: SessionContext,
    body: {{ kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> }},
  ) {{
    const row = await this.store.create(session.organizationId, {{
      domain: '{domain}',
      kind: body.kind,
      title: body.title,
      status: body.status,
      summary: body.summary,
      ownerLabel: body.ownerLabel,
      content: body.content,
    }});
    return {{ record: row, honesty: {to_camel(slug)}Honesty() }};
  }}
}}
""",
    )
    write(
        SRC / slug / f"{slug}.controller.ts",
        f"""import {{ Body, Controller, Get, Post, UseGuards }} from '@nestjs/common';
import {{ ClerkAuthGuard, SessionContext }} from '../common/guards/clerk-auth.guard';
import {{ CurrentSession }} from '../common/decorators/auth.decorators';
import {{ {pascal}Service }} from './{slug}.service';

@Controller('v1/{slug}')
export class {pascal}Controller {{
  constructor(private readonly service: {pascal}Service) {{}}

  @Get('engine')
  engine() {{ return this.service.engine(); }}

  @Get('products')
  products() {{ return this.service.products(); }}

  @Get('monitoring')
  monitoring() {{ return this.service.monitoring(); }}

  @Get('routes')
  routes() {{ return this.service.routes(); }}

  @Get('records')
  @UseGuards(ClerkAuthGuard)
  records(@CurrentSession() session: SessionContext) {{ return this.service.records(session); }}

  @Post('records')
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Body() body: {{ kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> }},
  ) {{
    return this.service.createRecord(session, body);
  }}
}}
""",
    )
    write(
        SRC / slug / f"{slug}.module.ts",
        f"""import {{ Module }} from '@nestjs/common';
import {{ IdentityModule }} from '../identity/identity.module';
import {{ AieStoreModule }} from '../aie-store/aie-store.module';
import {{ {pascal}Controller }} from './{slug}.controller';
import {{ {pascal}Service }} from './{slug}.service';

@Module({{
  imports: [IdentityModule, AieStoreModule],
  controllers: [{pascal}Controller],
  providers: [{pascal}Service],
  exports: [{pascal}Service],
}})
export class {pascal}Module {{}}
""",
    )
    write_application_layer(hub)


def write_web(hub: dict) -> None:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    endpoint = f"/v1/{slug}/products" if hub["kind"] == "foundation" else f"/v1/{slug}/engine"
    default_kind = "note" if hub["kind"] == "foundation" else hub.get("kinds", [("note", "Note")])[0][0]
    create_body = (
        "{ domain: 'foundation', kind, title, summary: 'Created from AIE console' }"
        if hub["kind"] == "foundation"
        else "{ kind, title, summary: 'Created from AIE console' }"
    )
    write(
        WEB / "app" / slug / "page.tsx",
        f"""import {{ {pascal}Client }} from './{slug}-client';

export default function {pascal}Page() {{
  return <{pascal}Client />;
}}
""",
    )
    write(
        WEB / "app" / slug / f"{slug}-client.tsx",
        f"""'use client';

import {{ FormEvent, useEffect, useState }} from 'react';
import {{ useAuth }} from '@clerk/nextjs';
import {{ apiFetch }} from '@/lib/api';
import {{ resolveApiToken }} from '@/lib/dev-auth';
import {{ AppShell }} from '@/components/app-shell';

type Engine = {{
  product: string;
  note: string;
  honesty: Record<string, boolean | string>;
  safety?: {{ note?: string }} & Record<string, unknown>;
  capabilities?: Array<Record<string, unknown>>;
  products?: Array<Record<string, unknown>>;
  investmentMode?: string;
}};

type RecordRow = {{
  id: string;
  domain: string;
  kind: string;
  title: string;
  status: string;
  summary: string;
  ownerLabel?: string | null;
}};

export function {pascal}Client() {{
  const {{ getToken, isLoaded }} = useAuth();
  const [data, setData] = useState<Engine | null>(null);
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('{default_kind}');
  const [busy, setBusy] = useState(false);

  useEffect(() => {{
    void apiFetch<Engine>('{endpoint}')
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }}, []);

  useEffect(() => {{
    if (!isLoaded) return;
    void (async () => {{
      try {{
        const token = await resolveApiToken(getToken);
        if (!token) return;
        const res = await apiFetch<{{ records: RecordRow[] }}>('/v1/{slug}/records', {{ token }});
        setRecords(res.records ?? []);
      }} catch {{
        /* public engine still useful without auth */
      }}
    }})();
  }}, [isLoaded, getToken]);

  async function onCreate(event: FormEvent) {{
    event.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {{
      const token = await resolveApiToken(getToken);
      if (!token) throw new Error('Not signed in — use /dev-login');
      await apiFetch('/v1/{slug}/records', {{
        token,
        method: 'POST',
        body: JSON.stringify({create_body}),
      }});
      const res = await apiFetch<{{ records: RecordRow[] }}>('/v1/{slug}/records', {{ token }});
      setRecords(res.records ?? []);
      setTitle('');
    }} catch (err) {{
      setError(err instanceof Error ? err.message : 'Create failed');
    }} finally {{
      setBusy(false);
    }}
  }}

  return (
    <AppShell>
      <h1 style={{{{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 720, letterSpacing: '-0.03em', margin: '0 0 0.35rem' }}}}>
        {hub["title"]}
      </h1>
      <p style={{{{ color: 'var(--muted)', margin: '0 0 1.75rem', maxWidth: '42rem' }}}}>
        VL-{hub["vl"]} — VerbaLab AI Economy console. Marketplace/commerce tooling; not world-largest-economy status, funding portal, or autonomous payouts.
      </p>
      {{error ? <p style={{{{ color: '#b42318' }}}}>{{error}}</p> : null}}
      {{!data && !error ? <p style={{{{ color: 'var(--muted)' }}}}>Loading…</p> : null}}
      {{data ? (
        <div style={{{{ display: 'grid', gap: '1.25rem' }}}}>
          <p style={{{{ margin: 0, color: 'var(--muted)' }}}}>{{data.note}}</p>
          {{data.safety?.note ? (
            <p style={{{{ margin: 0, borderLeft: '3px solid #0f766e', paddingLeft: '0.85rem', color: 'var(--muted)' }}}}>
              {{String(data.safety.note)}}
            </p>
          ) : null}}
          {{data.investmentMode ? (
            <p style={{{{ margin: 0, borderLeft: '3px solid #b45309', paddingLeft: '0.85rem' }}}}>
              Mode: {{data.investmentMode}} — fundingPortalOs=false, securitiesOfferingOs=false.
            </p>
          ) : null}}
          <pre style={{{{ margin: 0, padding: '1rem', background: 'var(--surface)', overflow: 'auto', fontSize: '0.78rem' }}}}>
            {{JSON.stringify({{ honesty: data.honesty, capabilities: data.capabilities, products: data.products }}, null, 2)}}
          </pre>
          <section className="vl-panel" style={{{{ padding: '1.2rem', display: 'grid', gap: '0.75rem' }}}}>
            <h2 style={{{{ margin: 0, fontSize: '1rem' }}}}>Records</h2>
            <ul style={{{{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.55rem' }}}}>
              {{records.map((r) => (
                <li key={{r.id}} style={{{{ borderTop: '1px solid var(--line)', paddingTop: '0.55rem' }}}}>
                  <strong>{{r.title}}</strong>{{' '}}
                  <span style={{{{ color: 'var(--muted)', fontSize: '0.85rem' }}}}>
                    {{r.kind}} · {{r.status}}
                  </span>
                  {{r.summary ? <p style={{{{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}}}>{{r.summary}}</p> : null}}
                </li>
              ))}}
              {{!records.length ? <li style={{{{ color: 'var(--muted)' }}}}>Sign in via /dev-login to load seeded AIE records.</li> : null}}
            </ul>
            <form onSubmit={{onCreate}} style={{{{ display: 'grid', gap: '0.55rem', marginTop: '0.5rem' }}}}>
              <label className="vl-label">
                Kind
                <input className="vl-field" value={{kind}} onChange={{(e) => setKind(e.target.value)}} />
              </label>
              <label className="vl-label">
                Title
                <input className="vl-field" value={{title}} onChange={{(e) => setTitle(e.target.value)}} required />
              </label>
              <button type="submit" className="vl-btn vl-btn-primary" disabled={{busy}} style={{{{ justifySelf: 'start' }}}}>
                {{busy ? 'Saving…' : 'Add record'}}
              </button>
            </form>
          </section>
        </div>
      ) : null}}
    </AppShell>
  );
}}
""",
    )


def write_docs(hub: dict) -> None:
    write(
        ROOT / "docs" / hub["doc"],
        f"""# {hub["title"]} (VL-{hub["vl"]})

Library Phase {hub["phase"]} — Volume 23 AI Economy (AIE).

## Mission

{hub["note"]}

## Honesty

- `internalMarketplaceSoftware=true`
- `worldsLargestAiEconomy=false`
- `handRolledCardHandling=false`
- `usesExistingBillingProcessor=true`
- `autonomousPayouts=false`
- `revenueShareLedgerOnly=true`
- `fundingPortalOs=false`
- `securitiesOfferingOs=false`
- `investmentDashboardOnly=true`

## APIs

- `GET /v1/{hub["slug"]}/{"products" if hub["kind"] == "foundation" else "engine"}`
- `GET /v1/{hub["slug"]}/records` (auth)
- `POST /v1/{hub["slug"]}/records` (auth)

## Console

`/{hub["slug"]}`

**Volume 23** AIE (VL-374–383). Audit: [`docs/aie-audit/`](./aie-audit/). ADR-{hub["adr"]}.
""",
    )
    write(
        ROOT / "docs" / "adr" / f"{hub['adr']}-{hub['slug']}.md",
        f"""# ADR-{hub["adr"]} — {hub["title"]}

## Status

Accepted - Volume 23 Phase {hub["phase"]} (VL-{hub["vl"]}).

## Context

Volume 23 README: build marketplace/commerce software, not a claim of world-largest AI economy.
Money movement uses existing Stripe/billing; revenue share is ledger/workflow; investment is dashboard-only.

## Decision

Ship `{hub["slug"]}` with AIE honesty flags. {hub["note"]}

## Consequences

Console + REST + GraphQL engine available. Real payouts/securities/tax remain human + provider concerns.
""",
    )


def write_resolver(hub: dict) -> None:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    camel = to_camel(slug)
    write(
        SRC / "graphql" / f"{slug}.resolver.ts",
        f"""import {{ Query, Resolver }} from '@nestjs/graphql';
import {{ QueryBus }} from '@nestjs/cqrs';
import {{ Get{pascal}EngineQuery }} from '../{slug}/application/messages';
import {{ Gql{pascal}Engine }} from './gql.types';

@Resolver()
export class {pascal}GraphqlResolver {{
  constructor(private readonly queries: QueryBus) {{}}

  @Query(() => Gql{pascal}Engine, {{ name: '{camel}Engine' }})
  async {camel}Engine(): Promise<Gql{pascal}Engine> {{
    const catalog = await this.queries.execute(new Get{pascal}EngineQuery());
    return {{
      product: catalog.product,
      note: catalog.note,
      internalMarketplaceSoftware: catalog.honesty.internalMarketplaceSoftware,
      worldsLargestAiEconomy: catalog.honesty.worldsLargestAiEconomy,
      handRolledCardHandling: catalog.honesty.handRolledCardHandling,
      autonomousPayouts: catalog.honesty.autonomousPayouts,
      fundingPortalOs: catalog.honesty.fundingPortalOs,
      securitiesOfferingOs: catalog.honesty.securitiesOfferingOs,
      investmentDashboardOnly: catalog.honesty.investmentDashboardOnly,
    }};
  }}
}}
""",
    )


def write_hub_spec(hub: dict) -> None:
    slug = hub["slug"]
    path = f"/v1/{slug}/products" if hub["kind"] == "foundation" else f"/v1/{slug}/engine"
    write(
        ROOT / "apps/api/test" / f"{slug}.spec.ts",
        f"""import {{ INestApplication }} from '@nestjs/common';
import {{ Test }} from '@nestjs/testing';
import request from 'supertest';
import {{ AppModule }} from '../src/app.module';

describe('{hub["title"]} (VL-{hub["vl"]})', () => {{
  let app: INestApplication;
  beforeAll(async () => {{
    const moduleRef = await Test.createTestingModule({{ imports: [AppModule] }}).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }});
  afterAll(async () => {{ await app.close(); }});
  it('exposes engine/products with honesty flags', async () => {{
    const res = await request(app.getHttpServer()).get('{path}').expect(200);
    expect(res.body.honesty.internalMarketplaceSoftware).toBe(true);
    expect(res.body.honesty.worldsLargestAiEconomy).toBe(false);
    expect(res.body.honesty.handRolledCardHandling).toBe(false);
    expect(res.body.honesty.autonomousPayouts).toBe(false);
    expect(res.body.honesty.fundingPortalOs).toBe(false);
    expect(res.body.honesty.securitiesOfferingOs).toBe(false);
    expect(res.body.honesty.investmentDashboardOnly).toBe(true);
  }});
}});
""",
    )


def write_audit_pack() -> None:
    audit = ROOT / "docs/aie-audit"
    write(audit / "PRODUCTION_READINESS.md", """# AIE Production Readiness

Volume 23 (VL-374-383).

- All hubs shipped
- worldsLargestAiEconomy=false
- handRolledCardHandling=false (Stripe / existing billing)
- autonomousPayouts=false (ledger/workflow only)
- fundingPortalOs=false / securitiesOfferingOs=false
- investmentDashboardOnly=true
- Prisma migrate includes 20261003290000_aie
""")
    write(audit / "ARCHITECTURE.md", """# AIE Architecture

Shared AieStore + Prisma AieRecord.
Foundation + commerce/licensing/revenue/talent/funding/community/investment/intelligence hubs.
Payments: existing Monetization Cloud / Stripe — not hand-rolled PCI.
Investment: dashboard/reporting only.
""")
    write(audit / "DEPLOYMENT.md", """# AIE Deployment

prisma migrate deploy includes 20261003290000_aie.
No new payment processor secrets required beyond existing Stripe billing config.
Do not enable autonomous payouts or in-app securities offerings.
""")
    write(audit / "COVERAGE.md", """# AIE Coverage

Phases 241-250 / VL-374-383 covered.
Tests: apps/api/test/aie-audit.spec.ts + per-hub specs.
""")
    write(audit / "PERFORMANCE.md", """# AIE Performance

Catalog/engine endpoints are static + Prisma list for records.
Suitable for console/admin workloads; not a high-frequency trading system.
""")
    write(audit / "GLOBAL_ECONOMY_REPORT.md", """# Global Economy Report

Internal VerbaLab AI Economy status report.

This software is VerbaLab's marketplace/commerce platform. It does **not** make
VerbaLab "the world's largest AI economy." That claim requires external adoption.

Guards:
- Billing via Stripe / existing processor
- Revenue share ledger without autonomous payouts
- Investment dashboard without funding-portal behavior
""")
    write(
        ROOT / "docs/adr/0286-aie-production-audit.md",
        """# ADR-0286 — AIE Production Audit

## Status

Accepted - Volume 23 Phase 250 (VL-383). Volume 23 closed.

## Decision

Ship audit pack under docs/aie-audit/ affirming honesty guards.
Ask for Volume 24 when ready. Prefer engineering-system assets (context docs,
architecture knowledge graph, repo templates) over more conceptual layers.
""",
    )


def write_audit_spec() -> None:
    hubs = [h["slug"] for h in HUBS]
    write(
        ROOT / "apps/api/test/aie-audit.spec.ts",
        f"""import {{ existsSync }} from 'fs';
import {{ join }} from 'path';
import {{ INestApplication }} from '@nestjs/common';
import {{ Test }} from '@nestjs/testing';
import request from 'supertest';
import {{ AppModule }} from '../src/app.module';

const VOLUME23_HUBS = {hubs!r};

describe('AIE Production Audit (VL-383)', () => {{
  let app: INestApplication;
  const root = join(__dirname, '../../..');
  const apiSrc = join(root, 'apps/api/src');
  beforeAll(async () => {{
    const moduleRef = await Test.createTestingModule({{ imports: [AppModule] }}).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  }});
  afterAll(async () => {{ await app.close(); }});
  it('has audit pack + ADRs', () => {{
    expect(existsSync(join(root, 'docs/adr/0286-aie-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/aie-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/aie-audit/GLOBAL_ECONOMY_REPORT.md'))).toBe(true);
    for (const hub of VOLUME23_HUBS) expect(existsSync(join(apiSrc, hub, `${{hub}}.catalog.ts`))).toBe(true);
    expect(existsSync(join(apiSrc, 'aie-store/aie-store.service.ts'))).toBe(true);
  }});
  it('foundation products include all hubs and honesty', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/ai-economy/products').expect(200);
    const ids = (res.body.products as Array<{{ id: string }}>).map((p) => p.id);
    for (const hub of VOLUME23_HUBS) expect(ids).toContain(hub);
    expect(res.body.honesty.worldsLargestAiEconomy).toBe(false);
    expect(res.body.honesty.handRolledCardHandling).toBe(false);
    expect(res.body.honesty.autonomousPayouts).toBe(false);
    expect(res.body.honesty.fundingPortalOs).toBe(false);
    expect(res.body.honesty.securitiesOfferingOs).toBe(false);
    expect(res.body.honesty.investmentDashboardOnly).toBe(true);
  }});
  it('guards endpoint enumerates money/securities rules', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/ai-economy/guards').expect(200);
    expect(res.body.honesty.usesExistingBillingProcessor).toBe(true);
    expect(Array.isArray(res.body.rules)).toBe(true);
    expect(res.body.rules.length).toBeGreaterThan(2);
  }});
  it('investment platform is dashboard-only', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/ai-investment-platform/engine').expect(200);
    expect(res.body.investmentMode).toBe('dashboard_reporting_only');
    expect(res.body.fundingPortalOs).toBe(false);
    expect(res.body.securitiesOfferingOs).toBe(false);
    expect(res.body.honesty.investmentDashboardOnly).toBe(true);
  }});
  it('domain engines expose honesty', async () => {{
    for (const hub of VOLUME23_HUBS.slice(1)) {{
      const res = await request(app.getHttpServer()).get(`/v1/${{hub}}/engine`).expect(200);
      expect(res.body.honesty.internalMarketplaceSoftware).toBe(true);
      expect(res.body.honesty.worldsLargestAiEconomy).toBe(false);
      expect(res.body.honesty.autonomousPayouts).toBe(false);
    }}
  }});
  it('overview requires auth', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/ai-economy/overview');
    expect([401, 403]).toContain(res.status);
  }});
}});
""",
    )


def patch_gql_types() -> None:
    path = SRC / "graphql/gql.types.ts"
    text = path.read_text()
    blocks = []
    for hub in HUBS:
        pascal = to_pascal(hub["slug"])
        name = f"Gql{pascal}Engine"
        if f"export class {name}" in text:
            continue
        blocks.append(
            f"""
@ObjectType()
export class {name} {{
  @Field()
  product!: string;

  @Field()
  note!: string;

  @Field(() => Boolean)
  internalMarketplaceSoftware!: boolean;

  @Field(() => Boolean)
  worldsLargestAiEconomy!: boolean;

  @Field(() => Boolean)
  handRolledCardHandling!: boolean;

  @Field(() => Boolean)
  autonomousPayouts!: boolean;

  @Field(() => Boolean)
  fundingPortalOs!: boolean;

  @Field(() => Boolean)
  securitiesOfferingOs!: boolean;

  @Field(() => Boolean)
  investmentDashboardOnly!: boolean;
}}
"""
        )
    if blocks:
        path.write_text(text.rstrip() + "\n" + "".join(blocks) + "\n")


def patch_wiring() -> None:
    # app.module
    app_mod = SRC / "app.module.ts"
    text = app_mod.read_text()
    imports, modules = [], []
    for hub in HUBS:
        pascal = to_pascal(hub["slug"])
        line = f"import {{ {pascal}Module }} from './{hub['slug']}/{hub['slug']}.module';"
        if line not in text:
            imports.append(line)
        mod = f"    {pascal}Module,"
        if mod not in text:
            modules.append(mod)
    if imports:
        text = insert_after(
            text,
            "import { GlobalAiStandardsModule } from './global-ai-standards/global-ai-standards.module';\n",
            "\n".join(imports) + "\n",
        )
    if modules:
        text = insert_after(
            text,
            "    GlobalAiStandardsModule,\n",
            "\n".join(modules) + "\n",
        )
    app_mod.write_text(text)

    # graphql.module
    gql_mod = SRC / "graphql/graphql.module.ts"
    text = gql_mod.read_text()
    app_imports, res_imports, app_modules, resolvers = [], [], [], []
    for hub in HUBS:
        pascal = to_pascal(hub["slug"])
        slug = hub["slug"]
        ai = f"import {{ {pascal}ApplicationModule }} from '../{slug}/application/{slug}-application.module';"
        ri = f"import {{ {pascal}GraphqlResolver }} from './{slug}.resolver';"
        if ai not in text:
            app_imports.append(ai)
        if ri not in text:
            res_imports.append(ri)
        am = f"    {pascal}ApplicationModule,"
        rr = f"    {pascal}GraphqlResolver,"
        if am not in text:
            app_modules.append(am)
        if rr not in text:
            resolvers.append(rr)
    if app_imports:
        text = insert_after(
            text,
            "import { GlobalAiStandardsApplicationModule } from '../global-ai-standards/application/global-ai-standards-application.module';\n",
            "\n".join(app_imports) + "\n",
        )
    if res_imports:
        text = insert_after(
            text,
            "import { GlobalAiStandardsGraphqlResolver } from './global-ai-standards.resolver';\n",
            "\n".join(res_imports) + "\n",
        )
    if app_modules:
        text = insert_after(
            text,
            "    GlobalAiStandardsApplicationModule,\n",
            "\n".join(app_modules) + "\n",
        )
    if resolvers:
        text = insert_after(
            text,
            "    GlobalAiStandardsGraphqlResolver,\n",
            "\n".join(resolvers) + "\n",
        )
    gql_mod.write_text(text)

    patch_gql_types()

    # openapi
    openapi = SRC / "openapi/openapi.document.ts"
    ot = openapi.read_text()
    paths_block = []
    for hub in HUBS:
        slug = hub["slug"]
        pascal = to_pascal(slug)
        if hub["kind"] == "foundation":
            entries = [
                ("products", f"list{pascal}Products", "AIE products"),
                ("engine", f"get{pascal}Engine", "AIE engine"),
                ("routing", f"get{pascal}Routing", "AIE routing"),
                ("guards", f"get{pascal}Guards", "AIE money/securities guards"),
                ("overview", f"get{pascal}Overview", "AIE overview"),
                ("records", f"list{pascal}Records", "AIE records"),
                ("monitoring", f"get{pascal}Monitoring", "AIE monitoring"),
            ]
        else:
            entries = [
                ("engine", f"get{pascal}Engine", f"{hub['title']} engine"),
                ("products", f"list{pascal}Products", f"{hub['title']} products"),
                ("monitoring", f"get{pascal}Monitoring", f"{hub['title']} monitoring"),
                ("routes", f"list{pascal}Routes", f"{hub['title']} routes"),
                ("records", f"list{pascal}Records", f"{hub['title']} records"),
            ]
        for path_suffix, op_id, summary in entries:
            path_key = f"'/v1/{slug}/{path_suffix}'"
            if path_key in ot:
                continue
            paths_block.append(
                f"""    {path_key}: {{
      get: {{
        summary: '{summary}',
        operationId: '{op_id}',
        responses: {{ '200': {{ description: 'OK' }} }},
      }},
    }},"""
            )
    if paths_block:
        ot = ot.replace(
            "    '/v1/localize/file': {",
            "\n".join(paths_block) + "\n\n    '/v1/localize/file': {",
        )
        openapi.write_text(ot)

    # sdk
    sdk = ROOT / "packages/sdk/src/client.ts"
    st = sdk.read_text()
    methods = []
    for hub in HUBS:
        slug = hub["slug"]
        camel = to_camel(slug)
        method = f"{camel}Products" if hub["kind"] == "foundation" else f"{camel}Engine"
        path = f"/v1/{slug}/products" if hub["kind"] == "foundation" else f"/v1/{slug}/engine"
        if f"async {method}(" in st:
            continue
        methods.append(
            f"""
  async {method}(): Promise<Record<string, unknown>> {{
    return this.requestJson('{path}', {{ method: 'GET' }});
  }}
"""
        )
    if "async aiEconomyGuards(" not in st:
        methods.append(
            """
  async aiEconomyGuards(): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/ai-economy/guards', { method: 'GET' });
  }
"""
        )
    if methods:
        anchor = "  private async parseJsonResponse"
        idx = st.find(anchor)
        if idx == -1:
            raise RuntimeError("SDK anchor parseJsonResponse not found")
        st = st[:idx] + "".join(methods) + "\n" + st[idx:]
        sdk.write_text(st)

    # cli
    cli = ROOT / "packages/cli/src/cli.ts"
    ct = cli.read_text()
    help_lines = []
    for hub in HUBS:
        cmd = f"{hub['slug']}-products" if hub["kind"] == "foundation" else f"{hub['slug']}-engine"
        line = f"  verbalab {cmd}"
        if line not in ct:
            help_lines.append(line)
    if "  verbalab ai-economy-guards" not in ct:
        help_lines.append("  verbalab ai-economy-guards")
    if help_lines:
        ct = ct.replace(
            "  verbalab plugin-operating-system-engine\n",
            "  verbalab plugin-operating-system-engine\n" + "\n".join(help_lines) + "\n",
        )
    handlers = []
    for hub in HUBS:
        slug = hub["slug"]
        camel = to_camel(slug)
        cmd = f"{slug}-products" if hub["kind"] == "foundation" else f"{slug}-engine"
        method = f"{camel}Products" if hub["kind"] == "foundation" else f"{camel}Engine"
        if f"command === '{cmd}'" in ct:
            continue
        handlers.append(
            f"""
  if (command === '{cmd}') {{
    console.log(JSON.stringify(await vl.{method}(), null, 2));
    return;
  }}
"""
        )
    if "command === 'ai-economy-guards'" not in ct:
        handlers.append(
            """
  if (command === 'ai-economy-guards') {
    console.log(JSON.stringify(await vl.aiEconomyGuards(), null, 2));
    return;
  }
"""
        )
    if handlers:
        ct = ct.replace(
            "  if (command === 'plugin-operating-system-engine') {\n    console.log(JSON.stringify(await vl.pluginOperatingSystemEngine(), null, 2));\n    return;\n  }",
            "  if (command === 'plugin-operating-system-engine') {\n    console.log(JSON.stringify(await vl.pluginOperatingSystemEngine(), null, 2));\n    return;\n  }"
            + "".join(handlers),
        )
    cli.write_text(ct)

    # nav
    nav = WEB / "lib/console-nav.ts"
    nt = nav.read_text()
    nav_lines = []
    for hub in HUBS:
        line = f"      {{ href: '/{hub['slug']}', label: '{hub['nav']}' }},"
        if line not in nt:
            nav_lines.append(line)
    if nav_lines:
        nt = nt.replace(
            "      { href: '/standards-analytics', label: 'Standards Analytics' },\n",
            "      { href: '/standards-analytics', label: 'Standards Analytics' },\n"
            + "\n".join(nav_lines)
            + "\n",
        )
        nav.write_text(nt)


def update_progress() -> None:
    progress = ROOT / "PROGRESS.md"
    pt = progress.read_text()
    pt = pt.replace(
        "Last updated: 2026-10-03 (VGAS ISO process maturity — ADR-0276; recognition flags still false)",
        "Last updated: 2026-10-03 (VL-383 Done — AIE Production Audit; Volume 23 closed)",
    )
    rows = """| VL-374 | AI Economy Foundation (Phase 241) | Done | `/ai-economy`; ADR-0277. `worldsLargestAiEconomy=false`. |
| VL-375 | AI Commerce Platform (Phase 242) | Done | Catalog/billing refs via Stripe; `handRolledCardHandling=false`; ADR-0278. |
| VL-376 | AI Licensing Platform (Phase 243) | Done | Entitlement ledger; ADR-0279. |
| VL-377 | Revenue Sharing Platform (Phase 244) | Done | Royalty/payout ledger; `autonomousPayouts=false`; ADR-0280. |
| VL-378 | AI Talent Platform (Phase 245) | Done | Linguist/voice/translator marketplace; ADR-0281. |
| VL-379 | Research Funding Platform (Phase 246) | Done | Grant tracking; ADR-0282. |
| VL-380 | Global Community Platform (Phase 247) | Done | Forums/events/hackathons; ADR-0283. |
| VL-381 | AI Investment Platform (Phase 248) | Done | Dashboard only; `fundingPortalOs=false`; ADR-0284. |
| VL-382 | Economic Intelligence (Phase 249) | Done | Exec/adoption/revenue dashboards; ADR-0285. |
| VL-383 | AIE Production Audit (Phase 250) | Done | Audit pack + economy report; ADR-0286. Volume 23 closed. |
"""
    if "VL-374" not in pt:
        pt = pt.replace(
            "| VL-373 | VGAS Production Audit (Phase 240) | Done | Audit pack + certification guide; ADR-0275. Volume 22 closed. |\n",
            "| VL-373 | VGAS Production Audit (Phase 240) | Done | Audit pack + certification guide; ADR-0275. Volume 22 closed. |\n"
            + rows,
        )
    changelog = """| 2026-10-03 | VL-374-382 Done: AIE hubs (Phases 241-249); ADR-0277-0285. Marketplace software; investment dashboard only; no autonomous payouts. |
| 2026-10-03 | VL-383 Done: AIE Production Audit (Phase 250); ADR-0286. Volume 23 closed. Ask for Volume 24 when ready. |
"""
    if "VL-374-382 Done" not in pt:
        pt = pt.rstrip() + "\n" + changelog + "\n"
    progress.write_text(pt)


def run_generation() -> None:
    copy_roadmap()
    ensure_prisma()
    write_aie_store()
    for hub in HUBS:
        if hub["kind"] == "foundation":
            write_foundation()
        else:
            write_domain(hub)
        write_web(hub)
        write_docs(hub)
        write_resolver(hub)
        write_hub_spec(hub)
    write_audit_pack()
    write_audit_spec()
    patch_wiring()
    update_progress()
    print(f"Generated Volume 23 AIE: {len(HUBS)} hubs + store + audit")


if __name__ == "__main__":
    run_generation()
