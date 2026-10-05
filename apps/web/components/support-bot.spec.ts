import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

/** Lightweight check that the support bot ships integration troubleshooting copy. */
describe('SupportBot integration teaching', () => {
  const src = readFileSync(join(__dirname, 'support-bot.tsx'), 'utf8');

  it('covers first-call, 401, 429, webhooks, and self-serve checklist', () => {
    expect(src).toMatch(/401|unauthorized/i);
    expect(src).toMatch(/429|rate.?limit/i);
    expect(src).toMatch(/webhook/i);
    expect(src).toMatch(/docs\/quickstart/);
    expect(src).toMatch(/playground/i);
    expect(src).toMatch(/Idempotency-Key/);
    expect(src).toMatch(/without paging the VerbaLab team|no ticket needed/i);
  });
});
