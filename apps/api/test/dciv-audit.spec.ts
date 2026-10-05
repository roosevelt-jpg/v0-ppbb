import { existsSync } from 'fs';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const VOLUME24_HUBS = ['digital-civilization', 'national-ai-platform', 'smart-city-platform', 'enterprise-nation-platform', 'global-language-preservation', 'universal-translation-grid', 'global-knowledge-network', 'global-ai-federation', 'civilization-intelligence-dashboard'];

describe('DCIV Production Audit (VL-393)', () => {
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
    expect(existsSync(join(root, 'docs/adr/0296-dciv-production-audit.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/dciv-audit/PRODUCTION_READINESS.md'))).toBe(true);
    expect(existsSync(join(root, 'docs/dciv-audit/CIVILIZATION_REPORT.md'))).toBe(true);
    for (const hub of VOLUME24_HUBS) expect(existsSync(join(apiSrc, hub, `${hub}.catalog.ts`))).toBe(true);
    expect(existsSync(join(apiSrc, 'dciv-store/dciv-store.service.ts'))).toBe(true);
  });
  it('foundation products include all hubs and honesty', async () => {
    const res = await request(app.getHttpServer()).get('/v1/digital-civilization/products').expect(200);
    const ids = (res.body.products as Array<{ id: string }>).map((p) => p.id);
    for (const hub of VOLUME24_HUBS) expect(ids).toContain(hub);
    expect(res.body.honesty.civilizationInfrastructureOs).toBe(false);
    expect(res.body.honesty.runsNationalInfrastructure).toBe(false);
    expect(res.body.honesty.productionCourtPoliceMilitary).toBe(false);
    expect(res.body.honesty.productionEmergencyDispatch).toBe(false);
    expect(res.body.honesty.productionCitizenIdentityAuth).toBe(false);
  });
  it('guards endpoint enumerates public-sector rules', async () => {
    const res = await request(app.getHttpServer()).get('/v1/digital-civilization/guards').expect(200);
    expect(res.body.honesty.demoPublicSectorPlatform).toBe(true);
    expect(Array.isArray(res.body.rules)).toBe(true);
    expect(res.body.rules.length).toBeGreaterThan(3);
  });
  it('national platform is demo-only for high-stakes domains', async () => {
    const res = await request(app.getHttpServer()).get('/v1/national-ai-platform/engine').expect(200);
    expect(res.body.deploymentMode).toBe('demo_public_sector_only');
    expect(res.body.productionCourtPoliceMilitary).toBe(false);
    expect(res.body.productionCitizenIdentityAuth).toBe(false);
    expect(res.body.authoritativeOutput).toBe(false);
  });
  it('smart city platform blocks production emergency dispatch', async () => {
    const res = await request(app.getHttpServer()).get('/v1/smart-city-platform/engine').expect(200);
    expect(res.body.deploymentMode).toBe('demo_city_integration_only');
    expect(res.body.productionEmergencyDispatch).toBe(false);
  });
  it('domain engines expose honesty', async () => {
    for (const hub of VOLUME24_HUBS.slice(1)) {
      const res = await request(app.getHttpServer()).get(`/v1/${hub}/engine`).expect(200);
      expect(res.body.honesty.demoPublicSectorPlatform).toBe(true);
      expect(res.body.honesty.runsNationalInfrastructure).toBe(false);
      expect(res.body.honesty.civilizationInfrastructureOs).toBe(false);
    }
  });
  it('overview requires auth', async () => {
    const res = await request(app.getHttpServer()).get('/v1/digital-civilization/overview');
    expect([401, 403]).toContain(res.status);
  });
});
