import { test, expect } from '@playwright/test';

test('management health endpoint reports the database as healthy', async ({ request }) => {
  const response = await request.get('/v1/management/health');

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({
    status: 'ok',
    info: {
      database: {
        status: 'up'
      }
    },
    error: {},
    details: {
      database: {
        status: 'up'
      }
    }
  });
});
