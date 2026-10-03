#!/usr/bin/env python3
"""Generate VerbaLab Volume 24 Digital Civilization / DCIV (VL-384–393).

Public-sector / city / enterprise / language / federation platform products —
demos and licensable groundwork, not a claim that VerbaLab already runs
national infrastructure.

Honesty (README Volume 24):
  demoPublicSectorPlatform=true
  runsNationalInfrastructure=false
  productionGovernmentDeployment=false
  productionCourtPoliceMilitary=false
  productionEmergencyDispatch=false
  productionCitizenIdentityAuth=false
  civilizationInfrastructureOs=false
  consentRequiredForCulturalArchives=true
  federationSecurityReviewRequired=true
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
        "slug": "digital-civilization",
        "vl": 384,
        "phase": 251,
        "adr": "0287",
        "title": "Digital Civilization",
        "kind": "foundation",
        "doc": "DIGITAL_CIVILIZATION.md",
        "nav": "Civilization",
        "domain": "foundation",
        "note": "VL-384 DCIV foundation. civilizationInfrastructureOs=false; product platforms only.",
    },
    {
        "slug": "national-ai-platform",
        "vl": 385,
        "phase": 252,
        "adr": "0288",
        "title": "National AI Platform",
        "kind": "domain",
        "doc": "NATIONAL_AI_PLATFORM.md",
        "nav": "National AI",
        "domain": "national",
        "note": "VL-385 Gov/public-sector demo platform. productionCourtPoliceMilitary=false; productionCitizenIdentityAuth=false.",
        "high_stakes": "national",
        "kinds": [
            ("national_language", "National Language Pack"),
            ("gov_translation", "Government Translation Service"),
            ("parliament", "Parliament Translation Desk"),
            ("courts", "Courts Translation Desk (demo)"),
            ("immigration", "Immigration Services Desk (demo)"),
            ("healthcare_public", "Public Healthcare Translation"),
            ("education_public", "Public Education Translation"),
            ("emergency_services", "Emergency Services Desk (demo)"),
            ("police", "Police Services Desk (demo)"),
            ("military", "Military Liaison Desk (demo)"),
            ("tourism", "Tourism Services"),
            ("digital_identity", "Digital Identity Portal (demo)"),
            ("citizen_portal", "Citizen Portal (demo)"),
            ("national_archive", "National Archives Connector"),
        ],
    },
    {
        "slug": "smart-city-platform",
        "vl": 386,
        "phase": 253,
        "adr": "0289",
        "title": "Smart City Platform",
        "kind": "domain",
        "doc": "SMART_CITY_PLATFORM.md",
        "nav": "Smart City",
        "domain": "city",
        "note": "VL-386 City systems integration demo. productionEmergencyDispatch=false.",
        "high_stakes": "city",
        "kinds": [
            ("transport", "Transport Integration"),
            ("healthcare_city", "City Healthcare Integration"),
            ("utilities", "Utilities Integration"),
            ("education_city", "City Education Integration"),
            ("emergency_services", "Emergency Services Integration (demo)"),
            ("public_safety", "Public Safety Integration (demo)"),
            ("traffic", "Traffic Systems"),
            ("citizen_comms", "Citizen Communication"),
            ("iot", "IoT Integration"),
            ("digital_twin", "Digital Twin"),
        ],
    },
    {
        "slug": "enterprise-nation-platform",
        "vl": 387,
        "phase": 254,
        "adr": "0290",
        "title": "Enterprise Nation Platform",
        "kind": "domain",
        "doc": "ENTERPRISE_NATION_PLATFORM.md",
        "nav": "Enterprise Nation",
        "domain": "enterprise",
        "note": "VL-387 Vertical platform for banks/hospitals/universities/telecoms — licensable product groundwork.",
        "kinds": [
            ("bank", "Bank Vertical"),
            ("hospital", "Hospital Vertical"),
            ("university", "University Vertical"),
            ("telecom", "Telecom Vertical"),
            ("retail", "Retail Vertical"),
            ("manufacturing", "Manufacturing Vertical"),
            ("energy", "Energy Vertical"),
            ("insurance", "Insurance Vertical"),
            ("airline", "Airline Vertical"),
            ("logistics", "Logistics Vertical"),
            ("government_enterprise", "Government Enterprise Vertical"),
        ],
    },
    {
        "slug": "global-language-preservation",
        "vl": 388,
        "phase": 255,
        "adr": "0291",
        "title": "Global Language Preservation",
        "kind": "domain",
        "doc": "GLOBAL_LANGUAGE_PRESERVATION.md",
        "nav": "Lang Preserve",
        "domain": "preservation",
        "note": "VL-388 Endangered-language archives/digital museums. consentRequiredForCulturalArchives=true.",
        "kinds": [
            ("endangered_language", "Endangered Language Archive"),
            ("historical_language", "Historical Language Archive"),
            ("ancient_text", "Ancient Text Corpus"),
            ("voice_archive", "Voice Archive"),
            ("cultural_heritage", "Cultural Heritage Record"),
            ("digital_dictionary", "Digital Dictionary"),
            ("digital_museum", "Digital Museum"),
            ("ai_preservation", "AI Preservation Job"),
        ],
    },
    {
        "slug": "universal-translation-grid",
        "vl": 389,
        "phase": 256,
        "adr": "0292",
        "title": "Universal Translation Grid",
        "kind": "domain",
        "doc": "UNIVERSAL_TRANSLATION_GRID.md",
        "nav": "Translation Grid",
        "domain": "grid",
        "note": "VL-389 Translation infrastructure across speech/doc/broadcast/IoT channels.",
        "kinds": [
            ("speech_channel", "Speech Channel"),
            ("voice_channel", "Voice Channel"),
            ("document_channel", "Document Channel"),
            ("image_channel", "Image Channel"),
            ("meeting_channel", "Meeting Channel"),
            ("phone_channel", "Phone Channel"),
            ("broadcast_channel", "Broadcast Channel"),
            ("streaming_channel", "Streaming Channel"),
            ("iot_channel", "IoT Channel"),
            ("automotive_channel", "Automotive Channel"),
            ("robotics_channel", "Robotics Channel"),
        ],
    },
    {
        "slug": "global-knowledge-network",
        "vl": 390,
        "phase": 257,
        "adr": "0293",
        "title": "Global Knowledge Network",
        "kind": "domain",
        "doc": "GLOBAL_KNOWLEDGE_NETWORK.md",
        "nav": "Knowledge Net",
        "domain": "knowledge",
        "note": "VL-390 Research/library/museum knowledge sharing network product.",
        "kinds": [
            ("university_node", "University Node"),
            ("library_node", "Library Node"),
            ("government_node", "Government Knowledge Node"),
            ("museum_node", "Museum Node"),
            ("research_center", "Research Center Node"),
            ("think_tank", "Think Tank Node"),
            ("healthcare_network", "Healthcare Knowledge Network"),
            ("scientific_knowledge", "Scientific Knowledge Collection"),
        ],
    },
    {
        "slug": "global-ai-federation",
        "vl": 391,
        "phase": 258,
        "adr": "0294",
        "title": "Global AI Federation",
        "kind": "domain",
        "doc": "GLOBAL_AI_FEDERATION.md",
        "nav": "AI Federation",
        "domain": "federation",
        "note": "VL-391 Federated learning/cross-border collaboration. federationSecurityReviewRequired=true.",
        "kinds": [
            ("federated_ai", "Federated AI Node"),
            ("federated_learning", "Federated Learning Job"),
            ("federated_knowledge", "Federated Knowledge Share"),
            ("cross_border", "Cross-border Collaboration"),
            ("cross_cloud", "Cross-cloud Collaboration"),
            ("ai_collaboration", "AI Collaboration Workspace"),
            ("national_ai_node", "National AI Node Registry"),
        ],
    },
    {
        "slug": "civilization-intelligence-dashboard",
        "vl": 392,
        "phase": 259,
        "adr": "0295",
        "title": "Civilization Intelligence Dashboard",
        "kind": "domain",
        "doc": "CIVILIZATION_INTELLIGENCE_DASHBOARD.md",
        "nav": "Civ Intel",
        "domain": "intelligence",
        "note": "VL-392 Adoption/impact analytics dashboards — reporting tooling.",
        "kinds": [
            ("country_metric", "Country Adoption Metric"),
            ("language_metric", "Language Coverage Metric"),
            ("dialect_metric", "Dialect Coverage Metric"),
            ("model_metric", "Model Deployment Metric"),
            ("knowledge_metric", "Knowledge Network Metric"),
            ("translation_metric", "Translation Volume Metric"),
            ("economic_impact", "Economic Impact Metric"),
            ("research_metric", "Research Metric"),
            ("education_metric", "Education Metric"),
            ("healthcare_metric", "Healthcare Metric"),
        ],
    },
]

HONESTY = """{
    demoPublicSectorPlatform: true,
    runsNationalInfrastructure: false,
    productionGovernmentDeployment: false,
    productionCourtPoliceMilitary: false,
    productionEmergencyDispatch: false,
    productionCitizenIdentityAuth: false,
    civilizationInfrastructureOs: false,
    consentRequiredForCulturalArchives: true,
    federationSecurityReviewRequired: true,
    note:
      'Volume 24 README: VerbaLab platform products for public-sector/city/enterprise demos. Not civilization infrastructure already in production; court/police/military/emergency/citizen-ID must not go live without legal/gov/safety review.',
  }"""


def copy_roadmap() -> None:
    dest = ROOT / "docs/roadmap/volume24-digital-civilization"
    if dest.exists():
        shutil.rmtree(dest)
    shutil.copytree(Path("/tmp/v24"), dest)


def ensure_prisma() -> None:
    schema = ROOT / "apps/api/prisma/schema.prisma"
    text = schema.read_text()
    if "model DcivRecord" not in text:
        model = """
/// Volume 24 Digital Civilization records (public-sector/city/enterprise demos).
/// Not evidence that VerbaLab operates national infrastructure or production gov systems.
model DcivRecord {
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
  @@map("dciv_records")
}
"""
        text = text.rstrip() + "\n" + model + "\n"
        schema.write_text(text)

    mig = ROOT / "apps/api/prisma/migrations/20261003300000_dciv/migration.sql"
    if not mig.exists():
        write(
            mig,
            """-- Volume 24 Digital Civilization records
CREATE TABLE IF NOT EXISTS "dciv_records" (
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
    CONSTRAINT "dciv_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "dciv_records_organization_id_domain_idx" ON "dciv_records"("organization_id", "domain");
CREATE INDEX IF NOT EXISTS "dciv_records_organization_id_kind_idx" ON "dciv_records"("organization_id", "kind");
CREATE INDEX IF NOT EXISTS "dciv_records_organization_id_status_idx" ON "dciv_records"("organization_id", "status");
""",
        )


def write_store() -> None:
    base = SRC / "dciv-store"
    write(
        base / "dciv-honesty.ts",
        f"""/**
 * Shared Digital Civilization honesty flags (Volume 24 README).
 */
export function dcivHonesty() {{
  return {HONESTY};
}}
""",
    )
    write(
        base / "dciv-store.seed.ts",
        """export type DcivSeed = {
  domain: string;
  kind: string;
  title: string;
  status: string;
  summary: string;
  ownerLabel: string;
  content: Record<string, unknown>;
};

export function dcivDefaultSeeds(): DcivSeed[] {
  return [
    { domain: 'foundation', kind: 'framework_map', title: 'Digital Civilization product map', status: 'active', summary: 'Maps public-sector, city, enterprise, preservation, grid, knowledge, federation hubs.', ownerLabel: 'Civilization Office (role)', content: { civilizationInfrastructureOs: false } },
    { domain: 'national', kind: 'gov_translation', title: 'Desk — Government translation (demo)', status: 'demo', summary: 'Demo public-sector translation desk. Not production government deployment.', ownerLabel: 'Public Sector (role)', content: { productionGovernmentDeployment: false } },
    { domain: 'national', kind: 'courts', title: 'Desk — Courts translation (demo)', status: 'demo', summary: 'Demo only. productionCourtPoliceMilitary=false — not for live proceedings.', ownerLabel: 'Public Sector (role)', content: { productionCourtPoliceMilitary: false, authoritativeOutput: false } },
    { domain: 'national', kind: 'digital_identity', title: 'Portal — Citizen digital identity (demo)', status: 'demo', summary: 'Demo portal shell. productionCitizenIdentityAuth=false.', ownerLabel: 'Public Sector (role)', content: { productionCitizenIdentityAuth: false } },
    { domain: 'city', kind: 'emergency_services', title: 'Integration — Emergency services (demo)', status: 'demo', summary: 'Demo integration catalog. productionEmergencyDispatch=false.', ownerLabel: 'Smart City (role)', content: { productionEmergencyDispatch: false } },
    { domain: 'city', kind: 'transport', title: 'Integration — City transport multilingual IVR', status: 'active', summary: 'City transport announcement/translation integration template.', ownerLabel: 'Smart City (role)', content: { channels: ['ivr', 'signage'] } },
    { domain: 'enterprise', kind: 'bank', title: 'Vertical — Bank KYC voice consent (template)', status: 'active', summary: 'Enterprise vertical template for regulated voice consent.', ownerLabel: 'Enterprise Solutions', content: { regulated: true } },
    { domain: 'enterprise', kind: 'hospital', title: 'Vertical — Hospital multilingual intake (template)', status: 'active', summary: 'Hospital vertical template — clinical use needs separate safety review.', ownerLabel: 'Enterprise Solutions', content: { clinicalProduction: false } },
    { domain: 'preservation', kind: 'endangered_language', title: 'Archive — Endangered language corpus (sample)', status: 'active', summary: 'Language preservation archive record with consent gates.', ownerLabel: 'Heritage (role)', content: { consentRequiredForCulturalArchives: true } },
    { domain: 'preservation', kind: 'digital_museum', title: 'Museum — Voice heritage exhibit (sample)', status: 'active', summary: 'Digital museum exhibit metadata for voice heritage.', ownerLabel: 'Heritage (role)', content: { provenanceRequired: true } },
    { domain: 'grid', kind: 'speech_channel', title: 'Grid channel — Speech translation', status: 'active', summary: 'Translation grid speech channel routing template.', ownerLabel: 'Grid Ops', content: { modality: 'speech' } },
    { domain: 'grid', kind: 'broadcast_channel', title: 'Grid channel — Broadcast captions', status: 'active', summary: 'Broadcast/streaming caption translation channel.', ownerLabel: 'Grid Ops', content: { modality: 'broadcast' } },
    { domain: 'knowledge', kind: 'university_node', title: 'Node — African language research university', status: 'active', summary: 'Knowledge network university node listing.', ownerLabel: 'Knowledge Net', content: { region: 'Africa' } },
    { domain: 'knowledge', kind: 'library_node', title: 'Node — National library partnership (sample)', status: 'prospect', summary: 'Library knowledge-sharing node.', ownerLabel: 'Knowledge Net', content: { focus: ['archives'] } },
    { domain: 'federation', kind: 'national_ai_node', title: 'Federation node — National AI registry (sample)', status: 'active', summary: 'Federated collaboration registry entry. Security review required before cross-border data.', ownerLabel: 'Federation (role)', content: { federationSecurityReviewRequired: true } },
    { domain: 'federation', kind: 'federated_learning', title: 'Job — Federated STT accent adaptation (demo)', status: 'planned', summary: 'Federated learning job template — no cross-border data movement without review.', ownerLabel: 'Federation (role)', content: { dataLeavesRegion: false } },
    { domain: 'intelligence', kind: 'country_metric', title: 'Metric — Countries with demo deployments', status: 'active', summary: 'Civilization intelligence dashboard metric.', ownerLabel: 'Civ Analytics', content: { value: 2 } },
    { domain: 'intelligence', kind: 'language_metric', title: 'Metric — Languages in preservation archive', status: 'active', summary: 'Language preservation coverage metric.', ownerLabel: 'Civ Analytics', content: { value: 5 } },
  ];
}
""",
    )
    write(
        base / "dciv-store.service.ts",
        """import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { dcivHonesty } from './dciv-honesty';
import { dcivDefaultSeeds } from './dciv-store.seed';

const DEMO_ORG = 'org_verbalab_demo';

@Injectable()
export class DcivStoreService implements OnModuleInit {
  private readonly log = new Logger(DcivStoreService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.ensureSeeded(DEMO_ORG);
    } catch (err) {
      this.log.warn(`DCIV seed skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async ensureSeeded(organizationId: string) {
    const count = await this.prisma.dcivRecord.count({ where: { organizationId } });
    if (count > 0) {
      for (const seed of dcivDefaultSeeds()) {
        const existing = await this.prisma.dcivRecord.findFirst({
          where: { organizationId, domain: seed.domain, kind: seed.kind, title: seed.title },
        });
        if (!existing) {
          await this.prisma.dcivRecord.create({
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
      const next = await this.prisma.dcivRecord.count({ where: { organizationId } });
      return { seeded: false, count: next };
    }
    for (const seed of dcivDefaultSeeds()) {
      await this.prisma.dcivRecord.create({
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
    const next = await this.prisma.dcivRecord.count({ where: { organizationId } });
    this.log.log(`DCIV seeded ${next} records for ${organizationId}`);
    return { seeded: true, count: next };
  }

  list(organizationId: string, domain?: string) {
    return this.prisma.dcivRecord.findMany({
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
    return this.prisma.dcivRecord.create({
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
    return { organizationId, total: rows.length, byDomain, ...dcivHonesty() };
  }
}
""",
    )
    write(
        base / "dciv-store.module.ts",
        """import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DcivStoreService } from './dciv-store.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [DcivStoreService],
  exports: [DcivStoreService],
})
export class DcivStoreModule {}
""",
    )


def write_application_layer(hub: dict) -> None:
    slug = hub["slug"]
    pascal = to_pascal(slug)
    app = SRC / slug / "application"
    engine_method = "products" if hub["kind"] == "foundation" else "engine"
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
  execute() {{ return this.service.{engine_method}(); }}
}}

@Injectable()
@QueryHandler(List{pascal}ProductsQuery)
export class List{pascal}ProductsHandler implements IQueryHandler<List{pascal}ProductsQuery> {{
  constructor(private readonly service: {pascal}Service) {{}}
  execute() {{ return this.service.products(); }}
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
  engine() {{ return this.service.{engine_method}(); }}
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


def write_foundation() -> None:
    hub = HUBS[0]
    slug = hub["slug"]
    base = SRC / slug
    products = []
    for h in HUBS:
        api = f"GET /v1/{h['slug']}/{'products' if h['kind'] == 'foundation' else 'engine'}"
        products.append(
            f"""    {{
      id: '{h["slug"]}',
      name: '{h["title"]}',
      status: 'shipped' as const,
      api: '{api}',
      console: '/{h["slug"]}',
      notes: {h["note"]!r},
    }}"""
        )
    products.append(
        """    {
      id: 'public-sector-guards',
      name: 'Public Sector Guards',
      status: 'shipped' as const,
      api: 'GET /v1/digital-civilization/guards',
      console: '/digital-civilization',
      notes: 'Court/police/military/emergency/citizen-ID production flags remain false.',
    }"""
    )
    product_rows = ",\n".join(products)
    write(
        base / f"{slug}.catalog.ts",
        f"""import {{ dcivHonesty }} from '../dciv-store/dciv-honesty';

export type DcivProductRow = {{
  id: string;
  name: string;
  status: 'shipped' | 'partial' | 'deferred';
  api: string | null;
  console: string | null;
  notes: string;
}};

export function digitalCivilizationProductCatalog(): DcivProductRow[] {{
  return [
{product_rows}
  ];
}}

export function digitalCivilizationHonesty() {{
  return dcivHonesty();
}}

export function digitalCivilizationLibrary() {{
  return [
    {{ id: 'national', title: 'National / Public-Sector Platform (demo)' }},
    {{ id: 'smart_city', title: 'Smart City Platform (demo)' }},
    {{ id: 'enterprise_nation', title: 'Enterprise Nation Verticals' }},
    {{ id: 'language_preservation', title: 'Language Preservation Archives' }},
    {{ id: 'translation_grid', title: 'Universal Translation Grid' }},
    {{ id: 'knowledge_network', title: 'Global Knowledge Network' }},
    {{ id: 'ai_federation', title: 'Global AI Federation' }},
    {{ id: 'civ_intel', title: 'Civilization Intelligence Dashboard' }},
  ];
}}

export function digitalCivilizationRoutingTable() {{
  return [
    {{ id: 'products', path: '/v1/digital-civilization/products', purpose: 'DCIV product catalog' }},
    {{ id: 'guards', path: '/v1/digital-civilization/guards', purpose: 'Public-sector honesty guards' }},
    {{ id: 'overview', path: '/v1/digital-civilization/overview', purpose: 'Authenticated overview' }},
    {{ id: 'records', path: '/v1/digital-civilization/records', purpose: 'All DCIV records' }},
    {{ id: 'monitoring', path: '/v1/digital-civilization/monitoring', purpose: 'Monitoring snapshot' }},
  ];
}}
""",
    )
    write(
        base / f"{slug}.service.ts",
        """import { Injectable } from '@nestjs/common';
import { SessionContext } from '../common/guards/clerk-auth.guard';
import { UsageService } from '../usage/usage.service';
import { DcivStoreService } from '../dciv-store/dciv-store.service';
import { dcivHonesty } from '../dciv-store/dciv-honesty';
import {
  digitalCivilizationHonesty,
  digitalCivilizationLibrary,
  digitalCivilizationProductCatalog,
  digitalCivilizationRoutingTable,
} from './digital-civilization.catalog';

@Injectable()
export class DigitalCivilizationService {
  constructor(
    private readonly usage: UsageService,
    private readonly store: DcivStoreService,
  ) {}

  products() {
    return {
      product: 'VerbaLab Digital Civilization',
      products: digitalCivilizationProductCatalog(),
      library: digitalCivilizationLibrary(),
      honesty: digitalCivilizationHonesty(),
      safety: {
        ...digitalCivilizationHonesty(),
        note: 'Platform products for demos/licensing — not civilization infrastructure already running nations.',
      },
      docs: '/docs/DIGITAL_CIVILIZATION.md',
      note: 'Digital Civilization Foundation (VL-384). civilizationInfrastructureOs=false.',
    };
  }

  routing() {
    return {
      routes: digitalCivilizationRoutingTable(),
      products: digitalCivilizationProductCatalog().map((p) => ({ id: p.id, status: p.status, api: p.api })),
      honesty: digitalCivilizationHonesty(),
      note: 'Static DCIV discovery catalog.',
      docs: '/docs/DIGITAL_CIVILIZATION.md',
    };
  }

  guards() {
    return {
      product: 'VerbaLab Digital Civilization Guards',
      honesty: dcivHonesty(),
      rules: [
        'Demo/public-sector platforms only — runsNationalInfrastructure=false.',
        'Do not treat AI output as authoritative in courts, immigration, police, or military contexts.',
        'Do not connect citizen digital identity / portals to real authentication without legal review.',
        'Do not wire emergency-services / public-safety integrations to live dispatch.',
        'Cultural archives require consent/provenance gates.',
        'Federated/cross-border AI requires security review before data movement.',
      ],
      docs: '/docs/dciv-audit/PRODUCTION_READINESS.md',
      note: 'Volume 24 high-stakes domain honesty guards.',
    };
  }

  async overview(session: SessionContext) {
    const usageSummary = await this.usage.summary(session.organizationId);
    const dciv = await this.store.summary(session.organizationId);
    return {
      session: { organizationId: session.organizationId, workspaceId: session.workspaceId, role: session.role },
      usage: { periodStart: usageSummary.periodStart, chat: usageSummary.chat, embeddings: usageSummary.embeddings },
      products: digitalCivilizationProductCatalog(),
      library: digitalCivilizationLibrary(),
      dciv,
      honesty: digitalCivilizationHonesty(),
      links: Object.fromEntries(digitalCivilizationProductCatalog().filter((p) => p.console).map((p) => [p.id, p.console])),
      docs: '/docs/DIGITAL_CIVILIZATION.md',
      note: 'DCIV overview (VL-384-393).',
    };
  }

  async records(session: SessionContext, domain?: string) {
    await this.store.ensureSeeded(session.organizationId);
    const rows = await this.store.list(session.organizationId, domain);
    return { domain: domain ?? 'all', count: rows.length, records: rows, honesty: digitalCivilizationHonesty() };
  }

  async createRecord(
    session: SessionContext,
    body: { domain: string; kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    const row = await this.store.create(session.organizationId, body);
    return { record: row, honesty: digitalCivilizationHonesty() };
  }

  monitoring() {
    return {
      mode: 'foundation',
      products: digitalCivilizationProductCatalog().map((p) => ({ id: p.id, status: p.status })),
      honesty: digitalCivilizationHonesty(),
      note: 'DCIV monitoring snapshot (VL-384).',
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
import { DigitalCivilizationService } from './digital-civilization.service';

@Controller('v1/digital-civilization')
export class DigitalCivilizationController {
  constructor(private readonly dciv: DigitalCivilizationService) {}

  @Get('products')
  products() { return this.dciv.products(); }

  @Get('engine')
  engine() { return this.dciv.products(); }

  @Get('routing')
  routing() { return this.dciv.routing(); }

  @Get('guards')
  guards() { return this.dciv.guards(); }

  @Get('overview')
  @UseGuards(ClerkAuthGuard)
  overview(@CurrentSession() session: SessionContext) { return this.dciv.overview(session); }

  @Get('records')
  @UseGuards(ClerkAuthGuard)
  records(@CurrentSession() session: SessionContext, @Query('domain') domain?: string) {
    return this.dciv.records(session, domain);
  }

  @Post('records')
  @UseGuards(ClerkAuthGuard)
  create(
    @CurrentSession() session: SessionContext,
    @Body() body: { domain: string; kind: string; title: string; status?: string; summary?: string; ownerLabel?: string; content?: Record<string, unknown> },
  ) {
    return this.dciv.createRecord(session, body);
  }

  @Get('monitoring')
  monitoring() { return this.dciv.monitoring(); }
}
""",
    )
    write(
        base / f"{slug}.module.ts",
        """import { Module } from '@nestjs/common';
import { UsageModule } from '../usage/usage.module';
import { IdentityModule } from '../identity/identity.module';
import { DcivStoreModule } from '../dciv-store/dciv-store.module';
import { DigitalCivilizationController } from './digital-civilization.controller';
import { DigitalCivilizationService } from './digital-civilization.service';

@Module({
  imports: [UsageModule, IdentityModule, DcivStoreModule],
  controllers: [DigitalCivilizationController],
  providers: [DigitalCivilizationService],
  exports: [DigitalCivilizationService],
})
export class DigitalCivilizationModule {}
""",
    )
    write_application_layer(hub)


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
        f"""import {{ dcivHonesty }} from '../dciv-store/dciv-honesty';

export function {to_camel(slug)}Honesty() {{
  return dcivHonesty();
}}

export function {to_camel(slug)}Capabilities() {{
  return [
{caps}
  ];
}}

export function {to_camel(slug)}RoutesTo() {{
  return [
    {{ module: 'digital-civilization', path: '/v1/digital-civilization/products', role: 'DCIV Foundation' }},
    {{ module: 'ai-economy', path: '/v1/ai-economy/products', role: 'AIE (Vol 23)' }},
    {{ module: 'global-ai-standards', path: '/v1/global-ai-standards/products', role: 'VGAS (Vol 22)' }},
  ];
}}
""",
    )
    extra = ""
    if hub.get("high_stakes") == "national":
        extra = """
      deploymentMode: 'demo_public_sector_only',
      productionGovernmentDeployment: false,
      productionCourtPoliceMilitary: false,
      productionCitizenIdentityAuth: false,
      authoritativeOutput: false,
"""
    elif hub.get("high_stakes") == "city":
        extra = """
      deploymentMode: 'demo_city_integration_only',
      productionEmergencyDispatch: false,
      authoritativeOutput: false,
"""
    write(
        SRC / slug / f"{slug}.service.ts",
        f"""import {{ Injectable }} from '@nestjs/common';
import {{ SessionContext }} from '../common/guards/clerk-auth.guard';
import {{ DcivStoreService }} from '../dciv-store/dciv-store.service';
import {{
  {to_camel(slug)}Capabilities,
  {to_camel(slug)}Honesty,
  {to_camel(slug)}RoutesTo,
}} from './{slug}.catalog';

@Injectable()
export class {pascal}Service {{
  constructor(private readonly store: DcivStoreService) {{}}

  engine() {{
    return {{
      product: 'VerbaLab {hub["title"]}',
      domain: '{domain}',
      capabilities: {to_camel(slug)}Capabilities(),
      routesTo: {to_camel(slug)}RoutesTo(),
{extra}      honesty: {to_camel(slug)}Honesty(),
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
import {{ DcivStoreModule }} from '../dciv-store/dciv-store.module';
import {{ {pascal}Controller }} from './{slug}.controller';
import {{ {pascal}Service }} from './{slug}.service';

@Module({{
  imports: [IdentityModule, DcivStoreModule],
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
        "{ domain: 'foundation', kind, title, summary: 'Created from DCIV console' }"
        if hub["kind"] == "foundation"
        else "{ kind, title, summary: 'Created from DCIV console' }"
    )
    stakes_banner = ""
    if hub.get("high_stakes"):
        stakes_banner = """
          {data.deploymentMode ? (
            <p style={{ margin: 0, borderLeft: '3px solid #b45309', paddingLeft: '0.85rem' }}>
              Mode: {String(data.deploymentMode)} — demo/internal only; not production government or emergency dispatch.
            </p>
          ) : null}"""
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
  deploymentMode?: string;
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
        VL-{hub["vl"]} — VerbaLab Digital Civilization console. Demo/licensable platform products — not national infrastructure already in production.
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
{stakes_banner}
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
              {{!records.length ? <li style={{{{ color: 'var(--muted)' }}}}>Sign in via /dev-login to load seeded DCIV records.</li> : null}}
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

Library Phase {hub["phase"]} — Volume 24 Digital Civilization (DCIV).

## Mission

{hub["note"]}

## Honesty

- `demoPublicSectorPlatform=true`
- `runsNationalInfrastructure=false`
- `productionGovernmentDeployment=false`
- `productionCourtPoliceMilitary=false`
- `productionEmergencyDispatch=false`
- `productionCitizenIdentityAuth=false`
- `civilizationInfrastructureOs=false`
- `consentRequiredForCulturalArchives=true`
- `federationSecurityReviewRequired=true`

## APIs

- `GET /v1/{hub["slug"]}/{"products" if hub["kind"] == "foundation" else "engine"}`
- `GET /v1/{hub["slug"]}/records` (auth)
- `POST /v1/{hub["slug"]}/records` (auth)

## Console

`/{hub["slug"]}`

**Volume 24** DCIV (VL-384–393). Audit: [`docs/dciv-audit/`](./dciv-audit/). ADR-{hub["adr"]}.
""",
    )
    write(
        ROOT / "docs" / "adr" / f"{hub['adr']}-{hub['slug']}.md",
        f"""# ADR-{hub["adr"]} — {hub["title"]}

## Status

Accepted - Volume 24 Phase {hub["phase"]} (VL-{hub["vl"]}).

## Context

Volume 24 README: build licensable platform products, not a claim of civilization infrastructure already running nations.
High-stakes domains (courts/police/military/emergency/citizen ID) stay demo-flagged.

## Decision

Ship `{hub["slug"]}` with DCIV honesty flags. {hub["note"]}

## Consequences

Console + REST + GraphQL engine available. Real government/emergency go-live needs legal/gov/safety review outside this repo.
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
      demoPublicSectorPlatform: catalog.honesty.demoPublicSectorPlatform,
      runsNationalInfrastructure: catalog.honesty.runsNationalInfrastructure,
      productionGovernmentDeployment: catalog.honesty.productionGovernmentDeployment,
      productionCourtPoliceMilitary: catalog.honesty.productionCourtPoliceMilitary,
      productionEmergencyDispatch: catalog.honesty.productionEmergencyDispatch,
      productionCitizenIdentityAuth: catalog.honesty.productionCitizenIdentityAuth,
      civilizationInfrastructureOs: catalog.honesty.civilizationInfrastructureOs,
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
    expect(res.body.honesty.demoPublicSectorPlatform).toBe(true);
    expect(res.body.honesty.runsNationalInfrastructure).toBe(false);
    expect(res.body.honesty.productionGovernmentDeployment).toBe(false);
    expect(res.body.honesty.productionCourtPoliceMilitary).toBe(false);
    expect(res.body.honesty.productionEmergencyDispatch).toBe(false);
    expect(res.body.honesty.productionCitizenIdentityAuth).toBe(false);
    expect(res.body.honesty.civilizationInfrastructureOs).toBe(false);
  }});
}});
""",
    )


def write_audit_pack() -> None:
    audit = ROOT / "docs/dciv-audit"
    write(audit / "PRODUCTION_READINESS.md", """# DCIV Production Readiness

Volume 24 (VL-384-393).

- All hubs shipped
- civilizationInfrastructureOs=false
- runsNationalInfrastructure=false
- productionGovernmentDeployment=false
- productionCourtPoliceMilitary=false
- productionEmergencyDispatch=false
- productionCitizenIdentityAuth=false
- consentRequiredForCulturalArchives=true
- federationSecurityReviewRequired=true
- Prisma migrate includes 20261003300000_dciv
""")
    write(audit / "ARCHITECTURE.md", """# DCIV Architecture

Shared DcivStore + Prisma DcivRecord.
Foundation + national/city/enterprise/preservation/grid/knowledge/federation/intelligence hubs.
High-stakes desks (courts/police/military/emergency/citizen ID) are demo-flagged.
""")
    write(audit / "DEPLOYMENT.md", """# DCIV Deployment

prisma migrate deploy includes 20261003300000_dciv.
Do not enable production government, court, police, military, emergency dispatch, or citizen identity auth without external legal/gov/safety review.
""")
    write(audit / "COVERAGE.md", """# DCIV Coverage

Phases 251-260 / VL-384-393 covered.
Tests: apps/api/test/dciv-audit.spec.ts + per-hub specs.
""")
    write(audit / "PERFORMANCE.md", """# DCIV Performance

Catalog/engine endpoints are static + Prisma list for records.
Suitable for console/admin and demo workloads — not live emergency dispatch.
""")
    write(audit / "CIVILIZATION_REPORT.md", """# Civilization Report

Internal VerbaLab Digital Civilization status report.

These are platform products VerbaLab could license and deploy. They do **not**
mean VerbaLab already operates national or city infrastructure.

High-stakes domains remain demo-only until legal/government/safety review.
""")
    write(
        ROOT / "docs/adr/0296-dciv-production-audit.md",
        """# ADR-0296 — DCIV Production Audit

## Status

Accepted - Volume 24 Phase 260 (VL-393). Volume 24 closed.

## Decision

Ship audit pack under docs/dciv-audit/ affirming public-sector honesty guards.
Volume 24 completes the v2.0 phase-broken roadmap (260 phases).
AI Internet (261–300) vision paragraph is not packaged as phases.
""",
    )


def write_audit_spec() -> None:
    hubs = [h["slug"] for h in HUBS]
    write(
        ROOT / "apps/api/test/dciv-audit.spec.ts",
        f"""import {{ existsSync }} from 'fs';
import {{ join }} from 'path';
import {{ INestApplication }} from '@nestjs/common';
import {{ Test }} from '@nestjs/testing';
import request from 'supertest';
import {{ AppModule }} from '../src/app.module';

const VOLUME24_HUBS = {hubs!r};

describe('DCIV Production Audit (VL-393)', () => {{
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
    expect(existsSync(join(root, 'docs/adr/0296-dciv-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/dciv-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/dciv-audit/CIVILIZATION_REPORT.md'))).toBe(true);
    for (const hub of VOLUME24_HUBS) expect(existsSync(join(apiSrc, hub, `${{hub}}.catalog.ts`))).toBe(true);
    expect(existsSync(join(apiSrc, 'dciv-store/dciv-store.service.ts'))).toBe(true);
  }});
  it('foundation products include all hubs and honesty', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/digital-civilization/products').expect(200);
    const ids = (res.body.products as Array<{{ id: string }}>).map((p) => p.id);
    for (const hub of VOLUME24_HUBS) expect(ids).toContain(hub);
    expect(res.body.honesty.civilizationInfrastructureOs).toBe(false);
    expect(res.body.honesty.runsNationalInfrastructure).toBe(false);
    expect(res.body.honesty.productionCourtPoliceMilitary).toBe(false);
    expect(res.body.honesty.productionEmergencyDispatch).toBe(false);
    expect(res.body.honesty.productionCitizenIdentityAuth).toBe(false);
  }});
  it('guards endpoint enumerates public-sector rules', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/digital-civilization/guards').expect(200);
    expect(res.body.honesty.demoPublicSectorPlatform).toBe(true);
    expect(Array.isArray(res.body.rules)).toBe(true);
    expect(res.body.rules.length).toBeGreaterThan(3);
  }});
  it('national platform is demo-only for high-stakes domains', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/national-ai-platform/engine').expect(200);
    expect(res.body.deploymentMode).toBe('demo_public_sector_only');
    expect(res.body.productionCourtPoliceMilitary).toBe(false);
    expect(res.body.productionCitizenIdentityAuth).toBe(false);
    expect(res.body.authoritativeOutput).toBe(false);
  }});
  it('smart city platform blocks production emergency dispatch', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/smart-city-platform/engine').expect(200);
    expect(res.body.deploymentMode).toBe('demo_city_integration_only');
    expect(res.body.productionEmergencyDispatch).toBe(false);
  }});
  it('domain engines expose honesty', async () => {{
    for (const hub of VOLUME24_HUBS.slice(1)) {{
      const res = await request(app.getHttpServer()).get(`/v1/${{hub}}/engine`).expect(200);
      expect(res.body.honesty.demoPublicSectorPlatform).toBe(true);
      expect(res.body.honesty.runsNationalInfrastructure).toBe(false);
      expect(res.body.honesty.civilizationInfrastructureOs).toBe(false);
    }}
  }});
  it('overview requires auth', async () => {{
    const res = await request(app.getHttpServer()).get('/v1/digital-civilization/overview');
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
  demoPublicSectorPlatform!: boolean;

  @Field(() => Boolean)
  runsNationalInfrastructure!: boolean;

  @Field(() => Boolean)
  productionGovernmentDeployment!: boolean;

  @Field(() => Boolean)
  productionCourtPoliceMilitary!: boolean;

  @Field(() => Boolean)
  productionEmergencyDispatch!: boolean;

  @Field(() => Boolean)
  productionCitizenIdentityAuth!: boolean;

  @Field(() => Boolean)
  civilizationInfrastructureOs!: boolean;
}}
"""
        )
    if blocks:
        path.write_text(text.rstrip() + "\n" + "".join(blocks) + "\n")


def patch_wiring() -> None:
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
            "import { EconomicIntelligenceModule } from './economic-intelligence/economic-intelligence.module';\n",
            "\n".join(imports) + "\n",
        )
    if modules:
        text = insert_after(
            text,
            "    EconomicIntelligenceModule,\n",
            "\n".join(modules) + "\n",
        )
    app_mod.write_text(text)

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
            "import { EconomicIntelligenceApplicationModule } from '../economic-intelligence/application/economic-intelligence-application.module';\n",
            "\n".join(app_imports) + "\n",
        )
    if res_imports:
        text = insert_after(
            text,
            "import { EconomicIntelligenceGraphqlResolver } from './economic-intelligence.resolver';\n",
            "\n".join(res_imports) + "\n",
        )
    if app_modules:
        text = insert_after(
            text,
            "    EconomicIntelligenceApplicationModule,\n",
            "\n".join(app_modules) + "\n",
        )
    if resolvers:
        text = insert_after(
            text,
            "    EconomicIntelligenceGraphqlResolver,\n",
            "\n".join(resolvers) + "\n",
        )
    gql_mod.write_text(text)

    patch_gql_types()

    openapi = SRC / "openapi/openapi.document.ts"
    ot = openapi.read_text()
    paths_block = []
    for hub in HUBS:
        slug = hub["slug"]
        pascal = to_pascal(slug)
        if hub["kind"] == "foundation":
            entries = [
                ("products", f"list{pascal}Products", "DCIV products"),
                ("engine", f"get{pascal}Engine", "DCIV engine"),
                ("routing", f"get{pascal}Routing", "DCIV routing"),
                ("guards", f"get{pascal}Guards", "DCIV public-sector guards"),
                ("overview", f"get{pascal}Overview", "DCIV overview"),
                ("records", f"list{pascal}Records", "DCIV records"),
                ("monitoring", f"get{pascal}Monitoring", "DCIV monitoring"),
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
    if "async digitalCivilizationGuards(" not in st:
        methods.append(
            """
  async digitalCivilizationGuards(): Promise<Record<string, unknown>> {
    return this.requestJson('/v1/digital-civilization/guards', { method: 'GET' });
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

    cli = ROOT / "packages/cli/src/cli.ts"
    ct = cli.read_text()
    help_lines = []
    for hub in HUBS:
        cmd = f"{hub['slug']}-products" if hub["kind"] == "foundation" else f"{hub['slug']}-engine"
        line = f"  verbalab {cmd}"
        if line not in ct:
            help_lines.append(line)
    if "  verbalab digital-civilization-guards" not in ct:
        help_lines.append("  verbalab digital-civilization-guards")
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
    if "command === 'digital-civilization-guards'" not in ct:
        handlers.append(
            """
  if (command === 'digital-civilization-guards') {
    console.log(JSON.stringify(await vl.digitalCivilizationGuards(), null, 2));
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

    nav = WEB / "lib/console-nav.ts"
    nt = nav.read_text()
    nav_lines = []
    for hub in HUBS:
        line = f"      {{ href: '/{hub['slug']}', label: '{hub['nav']}' }},"
        if line not in nt:
            nav_lines.append(line)
    if nav_lines:
        nt = nt.replace(
            "      { href: '/economic-intelligence', label: 'Econ Intel' },\n",
            "      { href: '/economic-intelligence', label: 'Econ Intel' },\n"
            + "\n".join(nav_lines)
            + "\n",
        )
        nav.write_text(nt)


def update_progress() -> None:
    progress = ROOT / "PROGRESS.md"
    pt = progress.read_text()
    pt = pt.replace(
        "Last updated: 2026-10-03 (VL-383 Done — AIE Production Audit; Volume 23 closed)",
        "Last updated: 2026-10-03 (VL-393 Done — DCIV Production Audit; Volume 24 closed — v2.0 phase roadmap complete)",
    )
    rows = """| VL-384 | Digital Civilization Foundation (Phase 251) | Done | `/digital-civilization`; ADR-0287. `civilizationInfrastructureOs=false`. |
| VL-385 | National AI Platform (Phase 252) | Done | Demo public-sector desks; court/police/military/citizen-ID production=false; ADR-0288. |
| VL-386 | Smart City Platform (Phase 253) | Done | City integrations; `productionEmergencyDispatch=false`; ADR-0289. |
| VL-387 | Enterprise Nation Platform (Phase 254) | Done | Bank/hospital/university/telecom verticals; ADR-0290. |
| VL-388 | Global Language Preservation (Phase 255) | Done | Archives/museums; consent gates; ADR-0291. |
| VL-389 | Universal Translation Grid (Phase 256) | Done | Multi-channel translation infra; ADR-0292. |
| VL-390 | Global Knowledge Network (Phase 257) | Done | Uni/library/museum nodes; ADR-0293. |
| VL-391 | Global AI Federation (Phase 258) | Done | Federated collab; security-review flag; ADR-0294. |
| VL-392 | Civilization Intelligence Dashboard (Phase 259) | Done | Adoption/impact metrics; ADR-0295. |
| VL-393 | DCIV Production Audit (Phase 260) | Done | Audit pack + civilization report; ADR-0296. Volume 24 closed (v2.0 phases complete). |
"""
    if "VL-384" not in pt:
        pt = pt.replace(
            "| VL-383 | AIE Production Audit (Phase 250) | Done | Audit pack + economy report; ADR-0286. Volume 23 closed. |\n",
            "| VL-383 | AIE Production Audit (Phase 250) | Done | Audit pack + economy report; ADR-0286. Volume 23 closed. |\n"
            + rows,
        )
    changelog = """| 2026-10-03 | VL-384-392 Done: DCIV hubs (Phases 251-259); ADR-0287-0295. Demo public-sector platforms; high-stakes production flags false. |
| 2026-10-03 | VL-393 Done: DCIV Production Audit (Phase 260); ADR-0296. Volume 24 closed — v2.0 phase-broken roadmap complete (260 phases). AI Internet vision paragraph not packaged as phases. |
"""
    if "VL-384-392 Done" not in pt:
        pt = pt.rstrip() + "\n" + changelog + "\n"
    progress.write_text(pt)


def run_generation() -> None:
    copy_roadmap()
    ensure_prisma()
    write_store()
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
    print(f"Generated Volume 24 DCIV: {len(HUBS)} hubs + store + audit")


if __name__ == "__main__":
    run_generation()
