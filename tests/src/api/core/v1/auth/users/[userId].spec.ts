import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

import { userDocument } from './helpers.js';

test.describe('/v1/auth/users/[userId]', () => {
  test.describe('GET /v1/auth/users/:userId', () => {
    test('returns a created user', async ({ request }) => {
      const suffix = randomUUID().replaceAll('-', '');
      const created = await request.post('/v1/auth/users', {
        data: {
          data: {
            type: 'users',
            attributes: {
              firstName: 'First',
              lastName: 'User',
              email: `user-${suffix}@example.test`
            }
          }
        }
      });
      const userId = (await userDocument(created)).data.id;
      const response = await request.get(`/v1/auth/users/${userId}`);

      expect(response.status()).toBe(200);
    });

    test('returns not found for an unknown UUID', async ({ request }) => {
      const response = await request.get('/v1/auth/users/1d3d9f96-3348-4f6b-8e37-8996ed77b917');

      expect(response.status()).toBe(404);
    });

    test('rejects a malformed UUID', async ({ request }) => {
      const response = await request.get('/v1/auth/users/not-a-uuid');

      expect(response.status()).toBe(400);
    });
  });

  test.describe('PATCH /v1/auth/users/:userId', () => {
    test('updates a name pair', async ({ request }) => {
      const suffix = randomUUID().replaceAll('-', '');
      const created = await request.post('/v1/auth/users', {
        data: {
          data: {
            type: 'users',
            attributes: {
              firstName: 'First',
              lastName: 'User',
              email: `user-${suffix}@example.test`
            }
          }
        }
      });
      const userId = (await userDocument(created)).data.id;
      const response = await request.patch(`/v1/auth/users/${userId}`, {
        data: {
          data: {
            type: 'users',
            id: userId,
            attributes: { firstName: 'Grace', lastName: 'Hopper' }
          }
        }
      });

      expect((await userDocument(response)).data.attributes.firstName).toBe('Grace');
    });

    test('normalizes an updated email', async ({ request }) => {
      const suffix = randomUUID().replaceAll('-', '');
      const created = await request.post('/v1/auth/users', {
        data: {
          data: {
            type: 'users',
            attributes: {
              firstName: 'First',
              lastName: 'User',
              email: `user-${suffix}@example.test`
            }
          }
        }
      });
      const userId = (await userDocument(created)).data.id;
      const response = await request.patch(`/v1/auth/users/${userId}`, {
        data: {
          data: {
            type: 'users',
            id: userId,
            attributes: { email: `  UPDATED-${suffix}@EXAMPLE.TEST ` }
          }
        }
      });

      expect((await userDocument(response)).data.attributes.email).toBe(
        `updated-${suffix}@example.test`
      );
    });

    test('updates status', async ({ request }) => {
      const suffix = randomUUID().replaceAll('-', '');
      const created = await request.post('/v1/auth/users', {
        data: {
          data: {
            type: 'users',
            attributes: {
              firstName: 'First',
              lastName: 'User',
              email: `user-${suffix}@example.test`
            }
          }
        }
      });
      const userId = (await userDocument(created)).data.id;
      const response = await request.patch(`/v1/auth/users/${userId}`, {
        data: { data: { type: 'users', id: userId, attributes: { status: 'SUSPENDED' } } }
      });

      expect((await userDocument(response)).data.attributes.status).toBe('SUSPENDED');
    });

    test('rejects a mismatched document ID', async ({ request }) => {
      const suffix = randomUUID().replaceAll('-', '');
      const created = await request.post('/v1/auth/users', {
        data: {
          data: {
            type: 'users',
            attributes: {
              firstName: 'First',
              lastName: 'User',
              email: `user-${suffix}@example.test`
            }
          }
        }
      });
      const userId = (await userDocument(created)).data.id;
      const response = await request.patch(`/v1/auth/users/${userId}`, {
        data: {
          data: {
            type: 'users',
            id: '1d3d9f96-3348-4f6b-8e37-8996ed77b917',
            attributes: { status: 'SUSPENDED' }
          }
        }
      });

      expect(response.status()).toBe(400);
    });

    test('rejects a partial name update', async ({ request }) => {
      const suffix = randomUUID().replaceAll('-', '');
      const created = await request.post('/v1/auth/users', {
        data: {
          data: {
            type: 'users',
            attributes: {
              firstName: 'First',
              lastName: 'User',
              email: `user-${suffix}@example.test`
            }
          }
        }
      });
      const userId = (await userDocument(created)).data.id;
      const response = await request.patch(`/v1/auth/users/${userId}`, {
        data: { data: { type: 'users', id: userId, attributes: { firstName: 'Only' } } }
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('DELETE /v1/auth/users/:userId', () => {
    test('returns no content', async ({ request }) => {
      const suffix = randomUUID().replaceAll('-', '');
      const created = await request.post('/v1/auth/users', {
        data: {
          data: {
            type: 'users',
            attributes: {
              firstName: 'First',
              lastName: 'User',
              email: `user-${suffix}@example.test`
            }
          }
        }
      });
      const userId = (await userDocument(created)).data.id;
      const response = await request.delete(`/v1/auth/users/${userId}`);

      expect(response.status()).toBe(204);
    });

    test('suspends instead of deleting', async ({ request }) => {
      const suffix = randomUUID().replaceAll('-', '');
      const created = await request.post('/v1/auth/users', {
        data: {
          data: {
            type: 'users',
            attributes: {
              firstName: 'First',
              lastName: 'User',
              email: `user-${suffix}@example.test`
            }
          }
        }
      });
      const userId = (await userDocument(created)).data.id;
      await request.delete(`/v1/auth/users/${userId}`);
      const response = await request.get(`/v1/auth/users/${userId}`);

      expect((await userDocument(response)).data.attributes.status).toBe('SUSPENDED');
    });

    test('returns not found for an unknown UUID', async ({ request }) => {
      const response = await request.delete('/v1/auth/users/1d3d9f96-3348-4f6b-8e37-8996ed77b917');

      expect(response.status()).toBe(404);
    });
  });
});
