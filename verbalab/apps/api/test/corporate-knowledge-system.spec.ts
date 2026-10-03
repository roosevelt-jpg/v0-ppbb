import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Corporate Knowledge System (VL-360)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('exposes engine/products with honesty flags', async () => {
    const res = await request(app.getHttpServer()).get('/v1/corporate-knowledge-system/engine').expect(200);
    expect(res.body.honesty.internalBusinessSoftware).toBe(true);
    expect(res.body.honesty.realCorporateGovernance).toBe(false);
    expect(res.body.honesty.boardOs).toBe(false);
    expect(res.body.note || res.body.product).toBeTruthy();
  });
});
