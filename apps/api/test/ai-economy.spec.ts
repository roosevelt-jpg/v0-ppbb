import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AI Economy (VL-374)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });
  afterAll(async () => { await app.close(); });
  it('exposes engine/products with honesty flags', async () => {
    const res = await request(app.getHttpServer()).get('/v1/ai-economy/products').expect(200);
    expect(res.body.honesty.internalMarketplaceSoftware).toBe(true);
    expect(res.body.honesty.worldsLargestAiEconomy).toBe(false);
    expect(res.body.honesty.handRolledCardHandling).toBe(false);
    expect(res.body.honesty.autonomousPayouts).toBe(false);
    expect(res.body.honesty.fundingPortalOs).toBe(false);
    expect(res.body.honesty.securitiesOfferingOs).toBe(false);
    expect(res.body.honesty.investmentDashboardOnly).toBe(true);
  });
});
