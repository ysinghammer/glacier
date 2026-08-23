import { expect, test } from '@playwright/test';

test.describe('GET /v1/management/health', () => {
  test('reports a healthy database without changing its state', async ({ request }) => {
    const first = await request.get('/v1/management/health');
    const second = await request.get('/v1/management/health');

    expect(first.status()).toBe(200);
    expect(second.status()).toBe(200);
    await expect(first.json()).resolves.toMatchObject({
      status: 'ok',
      info: { database: { status: 'up' } },
      error: {},
      details: { database: { status: 'up' } }
    });
    await expect(second.json()).resolves.toMatchObject({
      status: 'ok',
      details: { database: { status: 'up' } }
    });
  });
});
