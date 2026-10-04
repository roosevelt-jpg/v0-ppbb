import { existsSync } from 'fs';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const VOLUME23_HUBS = ['ai-economy', 'ai-commerce-platform', 'ai-licensing-platform', 'revenue-sharing-platform', 'ai-talent-platform', 'research-funding-platform', 'global-community-platform', 'ai-investment-platform', 'economic-intelligence'];

describe('AIE Production Audit (VL-383)', () => {
  let app: INestApplication;
  const root = join(__dirname, '../../..');
  const apiSrc = join(root, 'apps/api/src');
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  it('has audit pack + ADRs', () => {
    expect(existsSync(join(root, 'docs/adr/0286-aie-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/aie-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/aie-audit/GLOBAL_ECONOMY_REPORT.md'))).toBe(true);
    for (const hub of VOLUME23_HUBS) expect(existsSync(join(apiSrc, hub, `${hub}.catalog.ts`))).toBe(true);
    expect(existsSync(join(apiSrc, 'aie-store/aie-store.service.ts'))).toBe(true);
  });
  it('foundation products include all hubs and honesty', async () => {
    const res = await request(app.getHttpServer()).get('/v1/ai-economy/products').expect(200);
    const ids = (res.body.products as Array<{ id: string }>).map((p) => p.id);
    for (const hub of VOLUME23_HUBS) expect(ids).toContain(hub);
    expect(res.body.honesty.worldsLargestAiEconomy).toBe(false);
    expect(res.body.honesty.handRolledCardHandling).toBe(false);
    expect(res.body.honesty.autonomousPayouts).toBe(false);
    expect(res.body.honesty.fundingPortalOs).toBe(false);
    expect(res.body.honesty.securitiesOfferingOs).toBe(false);
    expect(res.body.honesty.investmentDashboardOnly).toBe(true);
  });
  it('guards endpoint enumerates money/securities rules', async () => {
    const res = await request(app.getHttpServer()).get('/v1/ai-economy/guards').expect(200);
    expect(res.body.honesty.usesExistingBillingProcessor).toBe(true);
    expect(Array.isArray(res.body.rules)).toBe(true);
    expect(res.body.rules.length).toBeGreaterThan(2);
  });
  it('investment platform is dashboard-only', async () => {
    const res = await request(app.getHttpServer()).get('/v1/ai-investment-platform/engine').expect(200);
    expect(res.body.investmentMode).toBe('dashboard_reporting_only');
    expect(res.body.fundingPortalOs).toBe(false);
    expect(res.body.securitiesOfferingOs).toBe(false);
    expect(res.body.honesty.investmentDashboardOnly).toBe(true);
  });
  it('domain engines expose honesty', async () => {
    for (const hub of VOLUME23_HUBS.slice(1)) {
      const res = await request(app.getHttpServer()).get(`/v1/${hub}/engine`).expect(200);
      expect(res.body.honesty.internalMarketplaceSoftware).toBe(true);
      expect(res.body.honesty.worldsLargestAiEconomy).toBe(false);
      expect(res.body.honesty.autonomousPayouts).toBe(false);
    }
  });
  it('overview requires auth', async () => {
    const res = await request(app.getHttpServer()).get('/v1/ai-economy/overview');
    expect([401, 403]).toContain(res.status);
  });
});
