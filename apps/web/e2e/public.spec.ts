import { expect, test } from '@playwright/test';

test.describe('Public console surfaces', () => {
  test('setup page explains required keys when Clerk is missing', async ({ page }) => {
    await page.goto('/setup');
    await expect(page.getByRole('heading', { name: 'Keys required' })).toBeVisible();
    await expect(page.getByText('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')).toBeVisible();
  });

  test('docs page loads OpenAPI marketing surface', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByRole('heading', { name: 'API documentation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'POST /v1/translate' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open explorer' })).toBeVisible();
  });

  test('OpenAPI explorer renders structured JSON controls', async ({ page }) => {
    await page.route('**/v1/openapi.json', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          openapi: '3.1.0',
          info: { title: 'VerbaLab API', version: '0.0.0', description: 'e2e fixture' },
          paths: {
            '/v1/translate': {
              post: {
                summary: 'Translate text',
                operationId: 'translate',
                tags: ['translate'],
                parameters: [],
                requestBody: {
                  content: {
                    'application/json': {
                      schema: { type: 'object' },
                    },
                  },
                },
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        }),
      });
    });

    await page.goto('/docs/openapi');
    await expect(page.getByRole('heading', { name: 'OpenAPI explorer' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Download raw JSON' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Endpoints \(1\)/i })).toBeVisible();
    await expect(page.getByText('/v1/translate').first()).toBeVisible();
    await expect(page.getByText('JSON explorer').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy full JSON' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Copy path' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hide value' }).first()).toBeVisible();
  });

  test('coverage page is reachable', async ({ page }) => {
    await page.goto('/coverage');
    await expect(page.getByRole('heading', { name: /coverage/i })).toBeVisible();
  });

  test('web health endpoint is ok', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.ok()).toBeTruthy();
    expect(await res.json()).toMatchObject({ status: 'ok', service: 'verbalab-web' });
  });
});
