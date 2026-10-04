import { HttpStatus, Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ApiException } from '../common/errors/api-exception';
import { developerGravityCatalog, developerGravityHonesty } from './developer-gravity.catalog';
import { SessionContext } from '../common/guards/clerk-auth.guard';

const PRODUCTS = [
  { id: 'verba-voice', path: '/v1/verba-voice', docs: '/docs/VERBA_VOICE.md', console: '/verba-voice' },
  {
    id: 'meeting-transcription',
    path: '/v1/meeting-transcription',
    docs: '/docs/MEETING_TRANSCRIPTION.md',
    console: '/meeting-transcription',
  },
  {
    id: 'compliance-attestations',
    path: '/v1/compliance-attestations',
    docs: '/docs/COMPLIANCE_ATTESTATIONS.md',
    console: '/compliance-attestations',
  },
  { id: 'voice-passport', path: '/v1/voice-passport', docs: '/docs/VOICE_PASSPORT.md', console: '/voice-passport' },
  { id: 'industry-drops', path: '/v1/industry-drops', docs: '/docs/INDUSTRY_DROPS.md', console: '/industry-drops' },
  { id: 'edge-offline', path: '/v1/edge-offline', docs: '/docs/EDGE_OFFLINE.md', console: '/edge-offline' },
  {
    id: 'africa-eval-matrix',
    path: '/v1/africa-eval-matrix',
    docs: '/docs/AFRICA_EVAL_MATRIX.md',
    console: '/africa-eval-matrix',
  },
  {
    id: 'sovereign-flywheel',
    path: '/v1/sovereign-flywheel',
    docs: '/docs/SOVEREIGN_FLYWHEEL.md',
    console: '/sovereign-flywheel',
  },
];

type Sandbox = {
  id: string;
  organizationId: string;
  name: string;
  tier: string;
  apiKeyHint: string;
  createdAt: string;
  expiresAt: string;
};

@Injectable()
export class DeveloperGravityService {
  private readonly sandboxes = new Map<string, Sandbox>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  engine() {
    return {
      ...developerGravityCatalog(),
      safety: developerGravityHonesty(),
      productCount: PRODUCTS.length,
      sandboxes: this.sandboxes.size,
      sdkPackages: ['@verbalab/sdk', '@verbalab/sdk-mobile', '@verbalab/cli'],
    };
  }

  catalog() {
    return {
      products: PRODUCTS,
      languages: ['typescript', 'python', 'curl', 'swift', 'kotlin'],
      templates: ['voice-chat', 'meeting-bot', 'eval-dashboard', 'edge-kiosk'],
      openapi: '/docs/openapi',
    };
  }

  async activity(organizationId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.auditEvent.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
        action: { contains: 'developer-gravity' },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, action: true, createdAt: true },
    });
    return {
      window: '7d',
      count: rows.length,
      events: rows.map((r) => ({ id: r.id, action: r.action, at: r.createdAt.toISOString() })),
    };
  }

  async overview(session: SessionContext) {
    return {
      session: {
        organizationId: session.organizationId,
        workspaceId: session.workspaceId,
        role: session.role,
      },
      engine: this.engine(),
      catalog: this.catalog(),
      activity: await this.activity(session.organizationId),
      links: { self: '/developer-gravity', docs: '/docs/DEVELOPER_GRAVITY.md', developers: '/developers' },
    };
  }

  monitoring() {
    return { status: 'ready', honesty: developerGravityHonesty() };
  }

  async sandbox(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const name = String(body.name ?? 'sandbox').trim();
    const tier = String(body.tier ?? 'trial');
    const secret = randomBytes(12).toString('hex');
    const sandbox: Sandbox = {
      id: randomUUID(),
      organizationId: session.organizationId,
      name,
      tier,
      apiKeyHint: `vl_test_${secret.slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    };
    this.sandboxes.set(sandbox.id, sandbox);
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'developer-gravity.sandbox',
      route: 'POST /v1/developer-gravity/sandbox',
      ip,
      metadata: { sandboxId: sandbox.id, tier } as never,
    });
    return {
      sandbox,
      apiKey: `vl_test_${secret}`,
      note: 'Sandbox key is returned once. Rate-limited; Africa residency default.',
    };
  }

  async quickstart(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const language = String(body.language ?? 'typescript').toLowerCase();
    const product = String(body.product ?? 'verba-voice');
    const ref = PRODUCTS.find((p) => p.id === product);
    if (!ref) {
      throw new ApiException('validation_error', 'unknown product', HttpStatus.BAD_REQUEST);
    }
    const enginePath = `${ref.path}/engine`;
    const snippets: Record<string, string> = {
      typescript: [
        "import { VerbaLab } from '@verbalab/sdk';",
        'const client = new VerbaLab({ apiKey: process.env.VERBALAB_API_KEY! });',
        `const engine = await fetch(\`\${process.env.VERBALAB_BASE}${enginePath}\`, {`,
        '  headers: { Authorization: `Bearer ${process.env.VERBALAB_API_KEY}` },',
        '}).then((r) => r.json());',
        'console.log(engine);',
        '// tip: prefer typed SDK helpers when available (e.g. client.verbaVoiceEngine())',
      ].join('\n'),
      python: `import os, requests\nr = requests.get(os.environ["VERBALAB_BASE"] + "${enginePath}", headers={"Authorization": f"Bearer {os.environ['VERBALAB_API_KEY']}"})\nprint(r.json())`,
      curl: `curl -H "Authorization: Bearer $VERBALAB_API_KEY" "$VERBALAB_BASE${enginePath}"`,
      swift: `// Use @verbalab/sdk-ios against ${ref.path}`,
      kotlin: `// Use @verbalab/sdk-android against ${ref.path}`,
    };
    const snippet = snippets[language] ?? snippets.typescript;
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'developer-gravity.quickstart',
      route: 'POST /v1/developer-gravity/quickstart',
      ip,
      metadata: { language, product } as never,
    });
    return {
      language,
      product,
      docs: ref.docs,
      console: ref.console,
      snippet,
    };
  }

  async refs(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const product = String(body.product ?? 'meeting-transcription');
    const ref = PRODUCTS.find((p) => p.id === product);
    if (!ref) {
      throw new ApiException('validation_error', 'unknown product', HttpStatus.BAD_REQUEST);
    }
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'developer-gravity.refs',
      route: 'POST /v1/developer-gravity/refs',
      ip,
      metadata: { product } as never,
    });
    return {
      product: ref,
      openapi: '/docs/openapi',
      sdk: {
        typescript: '@verbalab/sdk',
        mobile: '@verbalab/sdk-mobile',
        cli: '@verbalab/cli',
      },
      auth: ['Bearer vl_live_…', 'Clerk session', 'Model key vmod_…'],
    };
  }

  async sample(session: SessionContext, body: Record<string, unknown>, ip?: string) {
    const template = String(body.template ?? 'voice-chat');
    const stack = String(body.stack ?? 'next');
    const allowed = ['voice-chat', 'meeting-bot', 'eval-dashboard', 'edge-kiosk'];
    if (!allowed.includes(template)) {
      throw new ApiException('validation_error', 'unknown template', HttpStatus.BAD_REQUEST);
    }
    const scaffold = {
      id: randomUUID(),
      template,
      stack,
      files: [
        { path: 'README.md', purpose: 'Run instructions' },
        { path: '.env.example', purpose: 'VERBALAB_API_KEY + base URL' },
        { path: stack === 'next' ? 'app/page.tsx' : 'src/main.ts', purpose: 'Sample UI / entry' },
        { path: 'lib/verbalab.ts', purpose: 'SDK client bootstrap' },
      ],
      commands: ['pnpm install', 'pnpm dev'],
    };
    await this.audit.record({
      organizationId: session.organizationId,
      userId: session.userId,
      action: 'developer-gravity.sample',
      route: 'POST /v1/developer-gravity/sample',
      ip,
      metadata: { template, stack, scaffoldId: scaffold.id } as never,
    });
    return { scaffold };
  }
}
