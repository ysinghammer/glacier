# @glacier/http

Native Node HTTP/1.1 primitives and explicit application-owned composition. The package
is native ESM, ES2023, root-only, and currently verified on Node `24.21.0`. Imports do not
start resources or activate compiler reflection. TypeScript and pnpm are workspace-owned.

## Current implementation boundary

This is the phase-03 foundation, **not a production-ready full HTTP framework**. It provides
immutable success envelopes/cookies, detached normalized requests, and a one-use listener.
The necessary routing prerequisite is deliberately small: own `ApiController`, `ApiGet`,
and one `ApiResponse` declaration per zero-argument instance method. It exists to verify
cookie field emission and schema-validated JSON over real sockets. Authentication is the
only public request observation hook; there is no `inject`, raw request constructor,
middleware or response/socket escape hatch.

Duplicate controller/GET/response declarations fail rather than silently overwrite.
Current handlers must return `HttpResponse` values. The declared `void`/`undefined` 204
shorthand and repeatable coherent success declarations belong to the later response pipeline.

Other verbs, inherited declarations, all binders, multiple response alternatives, public
routes, full HEAD/OPTIONS semantics, request bodies/Expect handling, mappings/logging,
configurable receive/shutdown limits, bounded draining, registration snapshots and OpenAPI
remain unimplemented. Known unsupported methods currently return 405 with `Allow: GET`;
unknown paths return 404. Do not rely on this interim behavior as the completed v1 contract.
Use sequential lifecycle calls; concurrent startup/shutdown hardening is not yet provided.
No Express dependency, benchmark, browser compatibility or deployed-service E2E claim.

## Explicit composition

```ts
import {
  ApiController,
  ApiGet,
  ApiResponse,
  HttpCookie,
  HttpResponse,
  HttpServer,
} from "@glacier/http";

/** Application-owned controller; HTTP never constructs or destroys it. */
@ApiController("/session")
class SessionController {
  /** Clears the caller's session cookie with the original scope. */
  @ApiGet("/clear")
  @ApiResponse({ status: 204 })
  public clear(): HttpResponse<void> {
    return HttpResponse.noContent({ cookies: [HttpCookie.clear("session")] });
  }
}

const server = HttpServer.create({
  controllers: [new SessionController()],
  authentication: {
    challenge: { scheme: "Bearer", realm: "api" },
    authenticate: (request) => request.cookies.get("actor"),
  },
  onError: (error, context) => {
    void error;
    console.error(context.phase);
  },
});
await server.listen({ host: "127.0.0.1", port: 0 });
console.log(server.address());
await server.close();
```

The cookie-based authentication above is illustrative only, not secure token verification.
Real applications supply their own authentication/diagnostics. The hook receives normalized
headers/cookies/query/params, never the mutable Node request or response. Missing IDs yield
401 with the configured static challenge; empty IDs and hook failures yield safe 500.
Diagnostic callbacks must be synchronous/nonthrowing; rejected async callbacks and throws
produce minimal secret-safe process warnings. Error text is not sent to clients.

Use `experimentalDecorators` for legacy decorator syntax. If consumer declarations also
need compiler metadata, import `@glacier/reflection/register` before those declarations
and enable `emitDecoratorMetadata`. HTTP's explicit DTO references do not infer generics
or invoke DTO constructors. `ApiResponse({ status: 200, type: Dto })` and
`HttpResponse.json(dto)` validate/project through the public `Schema.safeSerialize` API
before bytes are committed; arrays require `isArray: true`. Undeclared fields are stripped.

## Value and normalization contracts

- `HttpResponse.json` accepts logical DTO objects/arrays and success statuses (default 200),
  excluding 204/205. `noContent` uses 204. Envelopes, headers and cookie lists are immutable
  snapshots; logical DTO contents remain caller-owned/untrusted until schema processing.
  Factories reject header injection, case-duplicate names, empty field lists and framing/
  connection/Content-Type/Content-Length/X-Request-Id overrides. Set-Cookie fields stay separate.
- Cookie defaults are `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`. Plain-HTTP development
  must explicitly disable Secure where appropriate. Names/opaque values and attributes are
  RFC-validated without implicit encoding. Expires dates are copied; Max-Age is safe integer
  seconds. Clear owns Max-Age=0 and past expiry. Host/Secure prefixes and SameSite=None enforce
  their security constraints; matching path/domain remains the application's obligation.
- Headers are case-insensitive with frozen `getAll` occurrences, captured before Node
  singleton normalization. `get` combines known comma-list fields and Cookie's semicolon
  fields only; unknown/non-list fields return their first occurrence, with all occurrences
  available through `getAll`. Duplicate Authorization/Proxy-Authorization/Host/Content-Type/
  Content-Length/Transfer-Encoding/Expect are rejected wherever Node delivers a parsed request.
  The native secure parser remains enabled; pre-parser failures need not have request IDs/hooks.
- Cookies split at the first `=`, remain opaque (no percent/plus decoding), preserve empty
  values, and reject duplicate names across fields. Request objects/views are detached and
  recursively frozen; AbortSignal remains the native cooperative notification API.
- Origin-form path segments decode once with strict percent/UTF-8 checks. Encoded slash,
  backslash, controls and dot segments are rejected. Case/interior repeated slashes remain
  significant; matching treats one trailing slash equivalently without rewriting the raw URL.
- Queries support `filter[name]=Ada`, repeated `tags=node&tags=ts`, and nested repeated scalar
  keys. Indexed/object arrays, empty brackets, dotted paths, hostile prototype keys, collisions
  and malformed encoding fail. Defaults bound targets to 8192 bytes, query pairs to 100 and
  key depth to 5. Singleton-array schema promotion remains a later binder responsibility.
- Request IDs are cryptographic UUIDs, generated independently of client headers and sent as
  X-Request-Id on parsed framework responses. Cooperative disconnect notification is provided;
  arbitrary consumer promises cannot be forcibly cancelled. Full shutdown cancellation/draining
  and lifecycle concurrency are deferred.

## Verification

[`tests/scenarios/README.md`](tests/scenarios/README.md) indexes public-root Vitest contracts
and real loopback/socket cases. [`tests/contracts/ReadonlyRequests.test-d.ts`](tests/contracts/ReadonlyRequests.test-d.ts)
checks erased readonly/configuration/response types separately. `pnpm run ci` orchestrates
build, type checks, Oxlint, Oxfmt and V8 coverage through Turborepo. Coverage requires 100%
statements, branches, functions and lines per production file, with no executable exclusions.
Generated results stay under ignored `tests/artifacts/`. This library creates no deployable
product; application/service Playwright E2E is inapplicable, not claimed as executed.

[CompiledConsumer](tests/data/compiler/CompiledConsumer.ts) is a genuine legacy-decorator
consumer compiled by workspace TypeScript into ignored artifacts before testing. Its
isolated process imports only package roots, explicitly registers compiler recording,
starts a loopback listener, consumes JSON/cookie fields, and closes it. DTO constructors
remain uninvoked and only the application constructs its controller. This complements
the ordinary-import inactive-resource probe; runtime coverage remains the source-root
Vitest scenarios, not a claim that erased types are instrumented.
