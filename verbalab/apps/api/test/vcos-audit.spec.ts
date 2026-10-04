import { existsSync } from 'fs';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const VOLUME21_HUBS = ['corporate-operating-system', 'corporate-governance-platform', 'strategic-planning-platform', 'enterprise-portfolio-management', 'business-architecture', 'enterprise-architecture-repository', 'corporate-knowledge-system', 'executive-intelligence-platform', 'corporate-risk-platform'];

describe('VCOS Production Audit (VL-363)', () => {
  let app: INestApplication;
  const root = join(__dirname, '../../..');
  const apiSrc = join(root, 'apps/api/src');

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('has audit pack + constitution docs + ADRs', () => {
    expect(existsSync(join(root, 'docs/adr/0265-vcos-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/DIGITAL_CONSTITUTION.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vcos-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vcos-audit/ARCHITECTURE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vcos-audit/COVERAGE.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vcos-audit/CORPORATE_READINESS_REPORT.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/vcos-audit/ENTERPRISE_GOVERNANCE_REPORT.md'))).toBe(true);
    for (const hub of VOLUME21_HUBS) {
      expect(existsSync(join(apiSrc, hub, `${hub}.catalog.ts`))).toBe(true);
    }
    expect(existsSync(join(apiSrc, 'vcos-store/vcos-store.service.ts'))).toBe(true);
  });

  it('foundation products list includes all hubs', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/corporate-operating-system/products')
      .expect(200);
    const ids = (res.body.products as Array<{ id: string }>).map((p) => p.id);
    for (const hub of VOLUME21_HUBS) {
      expect(ids).toContain(hub);
    }
    expect(ids).toContain('digital-constitution');
    expect(res.body.honesty.realCorporateGovernance).toBe(false);
  });

  it('constitution endpoint returns layers', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/corporate-operating-system/constitution')
      .expect(200);
    expect(res.body.layers.length).toBeGreaterThanOrEqual(8);
  });

  it('domain engines expose honesty', async () => {
    for (const hub of VOLUME21_HUBS.slice(1)) {
      const res = await request(app.getHttpServer()).get(`/v1/${hub}/engine`).expect(200);
      expect(res.body.honesty.internalBusinessSoftware).toBe(true);
      expect(res.body.honesty.boardOs).toBe(false);
    }
  });

  it('overview requires auth', async () => {
    const res = await request(app.getHttpServer()).get('/v1/corporate-operating-system/overview');
    expect([401, 403]).toContain(res.status);
  });
});
