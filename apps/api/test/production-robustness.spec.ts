import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { HERO_WEIGHT_LANGUAGES, probeWeightsDeploy } from '../src/model-runtime/weights-deploy';
import { EMAIL_TEMPLATE_CATALOG, previewEmailTemplate } from '../src/notifications/email-templates';
import { WebhookService } from '../src/jobs/webhook.service';

describe('production robustness (1–8)', () => {
  it('ships Fly production secrets helper', () => {
    const script = readFileSync(join(__dirname, '../../../scripts/fly-production-secrets.sh'), 'utf8');
    expect(script).toContain('CLERK_WEBHOOK_SIGNING_SECRET');
    expect(script).toContain('VERBALAB_WEIGHTS_URL');
    expect(script).toContain('NEXT_PUBLIC_CLERK_DOMAIN');
    expect(script).toContain('RATE_LIMIT_DISABLED=0');
  });

  it('includes welcome in email catalog', () => {
    expect(EMAIL_TEMPLATE_CATALOG.some((t) => t.id === 'welcome')).toBe(true);
    const preview = previewEmailTemplate('welcome');
    expect(preview.subject.toLowerCase()).toContain('welcome');
    expect(preview.html).toContain('credits');
  });

  it('hero weight languages cover Africa + strategic global', () => {
    for (const code of ['sw', 'yo', 'th', 'vi', 'hi', 'ht', 'qu'] as const) {
      expect(HERO_WEIGHT_LANGUAGES).toContain(code);
    }
  });

  it('weights probe reports hero languages when URL absent', async () => {
    const prev = process.env.VERBALAB_WEIGHTS_URL;
    delete process.env.VERBALAB_WEIGHTS_URL;
    const status = await probeWeightsDeploy();
    expect(status.status).toBe('absent');
    expect(status.heroLanguages).toEqual([...HERO_WEIGHT_LANGUAGES]);
    if (prev === undefined) delete process.env.VERBALAB_WEIGHTS_URL;
    else process.env.VERBALAB_WEIGHTS_URL = prev;
  });

  it('signs partner webhook payloads as v1= hmac', () => {
    const svc = new WebhookService({} as never);
    const sig = svc.signPayload('whsec_test', '1700000000', '{"event":"job.succeeded"}');
    expect(sig.startsWith('v1=')).toBe(true);
    expect(
      svc.verifySignature('whsec_test', '1700000000', '{"event":"job.succeeded"}', sig),
    ).toBe(true);
  });

  it('documents quickstart + partner webhooks', () => {
    const qs = readFileSync(join(__dirname, '../../../docs/QUICKSTART.md'), 'utf8');
    const wh = readFileSync(join(__dirname, '../../../docs/PARTNER_WEBHOOKS.md'), 'utf8');
    expect(qs).toContain('@verbalab/sdk');
    expect(qs).toContain('Idempotency-Key');
    expect(wh).toContain('organization.bootstrapped');
    expect(wh).toContain('credits.low');
  });
});
