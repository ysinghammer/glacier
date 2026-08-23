import { randomUUID } from 'node:crypto';

import { expect, test } from '@playwright/test';

import { userCollectionDocument, userDocument } from './users/helpers.js';

test.describe('/v1/auth/users', () => {
  test.describe('POST /v1/auth/users', () => {
    test('creates a user', async ({ request }) => {
      const suffix = randomUUID().replaceAll('-', '');
      const response = await request.post('/v1/auth/users', {
        data: {
          data: {
            type: 'users',
            attributes: {
              firstName: `First${suffix}`,
              lastName: `Last${suffix}`,
              email: `user-${suffix}@example.test`
            }
          }
        }
      });

      expect(response.status()).toBe(201);
    });

    test('trims names', async ({ request }) => {
      const suffix = randomUUID().replaceAll('-', '');
      const response = await request.post('/v1/auth/users', {
        data: {
          data: {
            type: 'users',
            attributes: {
              firstName: '  Ada  ',
              lastName: '  Lovelace  ',
              email: `ada-${suffix}@example.test`
            }
          }
        }
      });

      expect((await userDocument(response)).data.attributes).toMatchObject({
        firstName: 'Ada',
        lastName: 'Lovelace'
      });
    });

    test('normalizes email and defaults the status', async ({ request }) => {
      const suffix = randomUUID().replaceAll('-', '');
      const response = await request.post('/v1/auth/users', {
        data: {
          data: {
            type: 'users',
            attributes: {
              firstName: 'Ada',
              lastName: 'Lovelace',
              email: `  ADA-${suffix}@EXAMPLE.TEST  `
            }
          }
        }
      });

      expect((await userDocument(response)).data.attributes).toMatchObject({
        email: `ada-${suffix}@example.test`,
        status: 'ACTIVE'
      });
    });

    for (const [name, data] of [
      ['a missing document', {}],
      ['a wrong resource type', { data: { type: 'invalid', attributes: {} } }],
      [
        'invalid attributes',
        {
          data: {
            type: 'users',
            attributes: { firstName: ' ', lastName: 'Valid', email: 'not-an-email', extra: true }
          }
        }
      ]
    ]) {
      test(`rejects ${JSON.stringify(name)}`, async ({ request }) => {
        const response = await request.post('/v1/auth/users', { data });

        expect(response.status()).toBe(400);
      });
    }

    test('rejects a duplicate normalized email', async ({ request }) => {
      const suffix = randomUUID().replaceAll('-', '');
      await request.post('/v1/auth/users', {
        data: {
          data: {
            type: 'users',
            attributes: {
              firstName: 'First',
              lastName: 'User',
              email: `Email-${suffix}@Example.Test`
            }
          }
        }
      });
      const response = await request.post('/v1/auth/users', {
        data: {
          data: {
            type: 'users',
            attributes: {
              firstName: 'Second',
              lastName: 'User',
              email: ` email-${suffix}@example.test `
            }
          }
        }
      });

      expect(response.status()).toBe(409);
    });
  });

  test.describe('GET /v1/auth/users', () => {
    test('returns scoped pagination metadata', async ({ request }) => {
      const scope = `scope-${randomUUID().replaceAll('-', '')}`;
      for (const firstName of ['Alpha', 'Beta', 'Gamma']) {
        await request.post('/v1/auth/users', {
          data: {
            data: {
              type: 'users',
              attributes: {
                firstName,
                lastName: scope,
                email: `${firstName.toLowerCase()}-${scope}@example.test`
              }
            }
          }
        });
      }
      const response = await request.get('/v1/auth/users', {
        params: { 'filter[q]': scope, 'page[number]': '1', 'page[size]': '2' }
      });

      expect((await userCollectionDocument(response)).meta).toEqual({
        page: 1,
        pageSize: 2,
        total: 3
      });
    });

    test('sorts a scoped collection by email', async ({ request }) => {
      const scope = `scope-${randomUUID().replaceAll('-', '')}`;
      for (const [firstName, email] of [
        ['Alpha', `z-${scope}@example.test`],
        ['Beta', `a-${scope}@example.test`]
      ]) {
        await request.post('/v1/auth/users', {
          data: { data: { type: 'users', attributes: { firstName, lastName: scope, email } } }
        });
      }
      const response = await request.get('/v1/auth/users', {
        params: { 'filter[q]': scope, sort: 'email' }
      });

      expect((await userCollectionDocument(response)).data[0]?.attributes.email).toBe(
        `a-${scope}@example.test`
      );
    });

    test('filters suspended users from active results', async ({ request }) => {
      const scope = `scope-${randomUUID().replaceAll('-', '')}`;
      const created = await request.post('/v1/auth/users', {
        data: {
          data: {
            type: 'users',
            attributes: {
              firstName: 'Alpha',
              lastName: scope,
              email: `alpha-${scope}@example.test`
            }
          }
        }
      });
      const userId = (await userDocument(created)).data.id;
      await request.delete(`/v1/auth/users/${userId}`);
      const response = await request.get('/v1/auth/users', {
        params: { 'filter[q]': scope, 'filter[status]': 'ACTIVE' }
      });

      expect((await userCollectionDocument(response)).data).toHaveLength(0);
    });

    test('accepts accounts as an include', async ({ request }) => {
      const response = await request.get('/v1/auth/users', { params: { include: 'accounts' } });

      expect(response.status()).toBe(200);
    });

    const invalidQueries: Record<string, string>[] = [
      { 'page[number]': '0' },
      { 'page[size]': '101' },
      { 'page[size]': '1.5' },
      { 'filter[status]': 'DELETED' },
      { sort: '-firstName' },
      { sort: 'email,,createdAt' },
      { include: 'unknown' },
      { unknown: 'value' }
    ];

    for (const params of invalidQueries) {
      test(`rejects invalid query ${JSON.stringify(params)}`, async ({ request }) => {
        const response = await request.get('/v1/auth/users', { params });

        expect(response.status()).toBe(400);
      });
    }
  });
});
