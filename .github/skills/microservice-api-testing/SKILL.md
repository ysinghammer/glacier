---
name: microservice-api-testing
description: Create or extend consistent black-box Playwright API tests for any Glacier microservice. Use when adding HTTP API coverage, endpoints, test infrastructure, or a new backend service.
---

# Microservice API testing

Apply this standard to every HTTP microservice in the repository. Tests must verify public behavior through HTTP using Playwright's `APIRequestContext`. Do not import service classes, mock internal layers, query a service database, or seed state directly.

## Required structure

Keep all API tests under `tests/src/api/<service-name>/`, where `<service-name>` is the service's stable repository name without its `glacier-backend-` prefix.

```text
tests/src/api/
  core/
    v1/
      management/
        health.spec.ts
      auth/
        users.spec.ts
        users/
          [userId].spec.ts
  billing/
    v1/
      invoices.spec.ts
      invoices/
        [invoiceId].spec.ts
```

Rules:

1. The service directory is always the first segment after `tests/src/api`.
2. Inside it, mirror the endpoint URL exactly.
3. Use `[parameterName].spec.ts` for a dynamic URL segment.
4. Put every supported method for one concrete endpoint in that endpoint's one spec file.
5. Group each method under `test.describe('<METHOD> <URL>', ...)`. Place every test for that method and URL inside that block.
6. Every endpoint file must contain at least one test for every supported method.
7. Keep request setup, payloads, and assertions in the test that uses them. Prefer repeated explicit code to helper functions.

Use this shape even when an endpoint currently has only one test:

```ts
test.describe('POST /v1/invoices', () => {
  test('creates an invoice', async ({ request }) => {
    // ...
  });

  test('rejects invalid request documents', async ({ request }) => {
    // ...
  });
});
```

For example, test `PATCH /v1/invoices/:invoiceId/lines/:lineId` in:

```text
tests/src/api/billing/v1/invoices/[invoiceId]/lines/[lineId].spec.ts
```

## Adding a microservice to the test runtime

Every service test run must be self-contained and reproducible.

1. Identify the service's Dockerfile, required dependencies, health endpoint, port, environment variables, and migrations.
2. In `tests/src/globalSetup.ts`, create the service dependencies in the existing Testcontainers network.
3. Apply migrations before starting the service. Do not rely on an image entrypoint to do so unless the image explicitly guarantees it.
4. Wait for the service's public health/readiness endpoint before tests begin.
5. Give every new service a distinct exposed host port and base URL.
6. Add a Playwright project or service-specific request fixture when a service does not use the default `baseURL`.
7. Stop all added containers in the global teardown path, including partial-start cleanup in the error path.
8. Keep a service's data isolated: separate database/schema/bucket/queue namespace, unique container aliases, and unique test data.

Do not make tests depend on a locally running service, shared external cloud resource, pre-existing database, or execution order.

## Test conventions

### State isolation

- Create all state through the target service's public API.
- Generate collision-resistant suffixes for every resource name, email, code, search term, or idempotency key.
- Scope collection tests with unique public filters rather than assuming the database is empty.
- A test must be valid alone, in a retry, and when running next to a different service's tests.
- For a rejected mutation, fetch affected resources afterward and prove their observable state did not change.

### Public-contract assertions

- Assert exact status codes.
- Assert response bodies, headers, resource identity, normalization, defaults, pagination metadata, and lifecycle effects that clients can observe.
- Do not assert controller classes, commands, repositories, SQL, container names, or implementation-specific error messages.
- Prefer stable partial assertions for error messages and full equality only for deterministic documents.
- Assert no body for `204`; do not call `.json()` on an empty response.
- Verify expected read-only behavior with a follow-up request when the operation has stateful surroundings.
- Prefer many small, single-purpose tests with one or a few related assertions over a broad test with many assertions.
- Keep all setup and verification visible in the test body, even when it repeats a neighboring test.

### Coverage checklist

For every supported method, cover applicable items:

1. Successful request and full public response shape.
2. Persistence, read-only behavior, or externally observable side effect through a second HTTP request.
3. Required fields, wrong types, malformed values, boundary lengths/ranges, and unexpected fields.
4. Normalization, defaults, enum mapping, and immutable fields.
5. Resource identity consistency between route parameters, request documents, and responses.
6. Invalid input, missing resource, duplicate/conflict, and authorization outcomes exposed by the API.
7. Rejected mutation preserves state.
8. For collections: empty results, filter behavior, sort directions, pagination boundaries, and metadata.
9. Idempotency and lifecycle transitions where the API promises them.
10. Concurrency or idempotency-key behavior if the service publishes such a contract.

Only add cases that the public contract supports. When a black-box test reveals an unprotected invariant, add the test and make the smallest production change necessary to enforce it.

## Discovering an API contract

Before writing a test, trace the endpoint from its public controller to DTOs, mappers, application handlers, domain objects, persistence adapter, and service documentation:

```text
applications/<service>/src/**/presentation/controllers/
applications/<service>/src/**/dtos/
applications/<service>/src/**/mappers/
applications/<service>/src/**/application/
applications/<service>/src/**/domain/
applications/<service>/src/**/infrastructure/
```

Treat route definitions, input DTOs, response DTOs, and published API documentation as the HTTP contract. Use deeper layers only to discover invariants to prove through HTTP; do not test internal implementation paths directly.

Record non-obvious contract decisions in the relevant endpoint spec, especially:

- document envelope and content-type requirements;
- error response shape;
- timestamp/identifier format;
- pagination defaults and limits;
- filtering and sort grammar;
- normalization and uniqueness behavior;
- authorization and tenancy boundaries;
- soft-delete, idempotency, and event-driven side effects.

## Explicit test bodies

Do not create global, service-level, or cross-service test helper functions. Do not use payload factories, shared response assertions, generic request wrappers, or hidden setup/cleanup functions.

Repeat request payloads, resource creation, and assertions in each test. This intentionally keeps every test independently readable: a reader should see the request, response expectation, and public setup state without navigating to another file. Constants that name a stable URL or an individual test's generated value are acceptable when they improve clarity.

## Existing core service reference

`core` is the reference implementation of this standard:

- API tests: `tests/src/api/core/`
- container setup and migration application: `tests/src/globalSetup.ts`
- health endpoint: `GET /v1/management/health`

Follow its route-mirrored naming, explicit HTTP-only setup, unique data generation, persistence checks, and rejected-mutation preservation tests. Do not couple a new service's tests to Core routes or Core-specific resource shapes.

## Validation

Run the smallest relevant scope first:

```sh
pnpm --dir tests exec tsc --noEmit
pnpm --dir tests exec playwright test src/api/<service-name>
```

When global setup or a service's runtime configuration changes, run:

```sh
pnpm --dir tests exec playwright test
pnpm --filter @glacier/<service-package-name> build
```

Run the workspace build when the change affects shared packages or multiple services:

```sh
pnpm build
```
