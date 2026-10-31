# @glacier/http

Native Node HTTP/1.1 request handling and explicit application-owned composition. The package
is native ESM, ES2023, root-only, and currently verified on Node `24.21.0`. Imports do not
start resources or activate compiler reflection. TypeScript and pnpm are workspace-owned.

## Current implementation boundary

This is the phase-05 request pipeline, **not the completed production-ready v1 framework**.
It provides explicit GET/POST/PUT/PATCH/DELETE handlers, all request binders, external
authentication with method-level public opt-out, bounded JSON bodies, strict repeatable
response contracts, HEAD/OPTIONS and Expect handling, alongside immutable cookies/requests.
There is no `inject`, raw request constructor, middleware or response/socket escape hatch.

Duplicate controller/method/status declarations and equivalent routes fail rather than
silently overwrite. Every parameter has an explicit binder and every success status has
an explicit `ApiResponse`. `void`/`undefined` means 204 only when declared; JSON endpoints
cannot silently succeed without a body. Controllers remain shared application-owned instances.

Static business mappings, metadata-only response logging and bounded log draining are implemented.
Complete configurable lifecycle/normalization limits, transport shutdown hardening and OpenAPI
remain deferred. `HttpEndpointMetadata.read(Class)` and `server.registration` are deliberate
immutable public documentation contracts, with no instances/listeners/callbacks or OpenAPI dependency.
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

### Required JSON and explicit binders

```ts
import { IsInt, IsString } from "@glacier/schema";
import {
  ApiBody,
  ApiController,
  ApiParam,
  ApiPost,
  ApiResponse,
  ApiUserId,
  HttpResponse,
} from "@glacier/http";

/** Boundary schema; HTTP creates validated DTO-shaped values without running constructors. */
class UpdateDto {
  @IsInt() count!: number;
  @IsString() label!: string;
}

/** Application-owned adapter; authorization belongs in its application operation. */
@ApiController("/items", { tags: ["items"] })
class ItemsController {
  /** Uses explicit input identities; no erased DTO or response generic is inferred. */
  @ApiPost("/:id", { summary: "Update an item" })
  @ApiResponse({ status: 200, type: UpdateDto })
  public update(
    @ApiParam("id") id: string,
    @ApiUserId() userId: string,
    @ApiBody(UpdateDto) input: UpdateDto,
  ): HttpResponse<UpdateDto> {
    void [id, userId];
    return HttpResponse.json(input);
  }
}
```

Register `new ItemsController()` with `HttpServer.create`, supplying external authentication
and synchronous diagnostics as above. A real controller passes the ID and user ID to its
authorized application operation rather than discarding them as this transport example does.
`ApiUserId` requires authentication and cannot appear on an `ApiPublic` endpoint. Compiler
metadata, when explicitly enabled/registered, checks representable UserId types and parameter
counts including defaults; annotate defaulted parameters explicitly because TypeScript may
otherwise emit `Object`. Without recording, only JavaScript's required argument count is
available: erased optional/rest signatures cannot be recovered. Explicit DTO binders always
determine validation, never compiler types.

`ApiQuery(Dto)` alone enables singleton scalar-array promotion (including nested arrays).
Query/params/headers/cookies DTOs coerce textual input; `ApiBody(Dto)` never coerces JSON.
Header DTO wire names are lower-case; use schema `Rename` for dashed names. Direct
`ApiParam(name)` binds a required nonempty string; `ApiHeader(name)` and `ApiCookie(name)`
return strings or undefined and preserve empty/opaque cookie values. `ApiRequest()` supplies
the frozen request and its cooperative cancellation signal.

Bodies require nonempty UTF-8 `application/json` or `application/*+json` objects, with optional
UTF-8 charset. Empty/malformed/nonobject/invalid DTO input is 400; unsupported media or any
Content-Encoding is 415. Nonempty unbound bodies are 400; empty chunked unbound input is allowed.
`limits.bodyBytes` defaults to 1,048,576 and `limits.requestTimeoutMs` to 30,000, both positive
finite safe integers. Declared and streamed excess yields 413 where transport permits;
incomplete body timeout/disconnect closes the transport, never a success response. Timeouts
are receive bounds, not controller execution deadlines. Public issues contain location/path/code
only; invalid outputs produce generic 500 and value-free path/code diagnostics before headers commit.

Authentication occurs once after route/normalization and before body work, and `ApiPublic`
skips it. `Expect: 100-continue` receives Continue only when input will actually be read;
preflight rejections close with a final error without requiring body bytes. Other Expect values
receive 417. HEAD runs the complete GET pipeline and preserves serialized Content-Length but
never sends body bytes, even for errors. OPTIONS on known paths returns 204 with stable Allow
and skips authentication; other unsupported methods return 405 with Allow, unknown paths 404.
No CORS headers are generated. Static path segments outrank parameters lexicographically,
independent of registration order. Inherited handlers retain their declaring contracts and
nearest controller prefix; overrides must explicitly redeclare routes/responses/binders/flags
rather than inherit metadata from another handler function.
Instance-local handler replacements are rejected rather than bypassing the validated prototype
signature; construction does not invoke instance handler getters. Arbitrary Proxy traps and
replaced platform intrinsics are not sandboxed.

## Static errors and supervised response logs

```ts
import { ApiController, ApiGet, ApiMapError, ApiResponse, HttpServer } from "@glacier/http";

/** Application-owned exceptional type, translated by the transport adapter. */
class UnavailableError extends Error {}

/** Only controllers may translate typed application rejections into mapped exceptions. */
@ApiController("/availability")
@ApiMapError(UnavailableError, {
  status: 503,
  title: "Service unavailable",
  detail: "Please try again later",
  type: "https://example.com/problems/unavailable",
})
class AvailabilityController {
  /** Illustrative unavailable dependency; real application operations retain typed expected outcomes. */
  @ApiGet("/")
  @ApiResponse({ status: 204 })
  public check(): never {
    throw new UnavailableError("private implementation detail");
  }
}

const server = HttpServer.create({
  controllers: [new AvailabilityController()],
  onResponseLog: (record) => {
    console.log(JSON.stringify(record));
  },
  // Consumer diagnostics must also avoid writing secrets from private exception objects.
  onError: (error, context) => {
    void error;
    console.error(context.phase);
  },
  limits: { pendingResponseLogs: 1000, shutdownTimeoutMs: 10000 },
});
await server.listen({ host: "127.0.0.1", port: 0 });
await server.close();
```

`ApiMapError(ErrorClass, { status, title, detail?, type? })` is repeatable on classes and
instance endpoints. Explicit global `errorMappings` records additionally contain `error`.
Only controller invocation throws qualify: endpoint scope beats controller scope beats global,
then the nearest matching exception prototype wins. Duplicates within a scope, non-Error
constructors, non-4xx/5xx statuses, control-bearing static text and nonabsolute/whitespace-bearing
type URIs fail preparation. A controller scope inherits from the nearest class declaration;
unchanged handlers retain their own endpoint scope, but overrides must redeclare it.
Mappings never invoke exception constructors, callbacks or value getters.

Framework errors retain RFC 9457 `application/problem+json`, `about:blank` and standard reason
phrases. Mappings use declared static details (defaulting to title) and optional absolute type.
No raw messages, cause, stack, properties or schema diagnostic values enter client payloads.
Mapped 401 includes the configured static authentication challenge when authentication exists.
Mapped 4xx is a deliberate rejection without unexpected-failure diagnostics; mapped 5xx and
unmapped exceptions invoke diagnostics. Auth, input, output, logging and transport remain
framework-owned and cannot be remapped, even when response/cookie factories or schema operations
fail inside a controller. Factory causes and schema issue values are redacted from diagnostics;
schema issues expose only paths/codes. Direct factory callers still receive preserved causes.

`onResponseLog` receives one frozen completion record: requestId, method, optional matched
route/userId/committed status, durationMs, bodyBytes, and completed/disconnected/failed outcome.
There are no request handles, raw targets/queries, headers/cookies, bodies or exception objects.
Status is absent before final headers; HEAD bytes are zero. Bytes count the body handed to
native transport, **not client delivery**. Unexpected processing failures that finish an error
response use `failed`; deliberate rejections use `completed`; premature native closure uses
`disconnected`. Pre-parser failures need not create records. `ApiSkipResponseLogging()` excludes
all matched endpoint outcomes, including auth/input failure and disconnect, but not diagnostics.
Unmatched parsed requests remain loggable.

Responses are sent before logging runs. Async logging never delays transmission: pending work
is capped by `pendingResponseLogs` (default 1000); excess records are not enqueued and overflow
is diagnosed. Thrown/rejected logging is supervised once. `close()` waits for transport stop,
then drains logs within `shutdownTimeoutMs` (default 10000); timeout diagnoses and rejects close,
while late settlements remain supervised. Consumer promises cannot be forcibly cancelled.
This budget currently bounds **logging drain**, not complete transport shutdown (phase 06).
Throwing or async diagnostics produce only nonrecursive fixed process warnings; private exception
values are never included in fallback output. TypeScript cannot enforce synchronous void callbacks,
so runtime observes invalid async diagnostics too.

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
  key depth to 5. Query DTO binding explicitly enables singleton-array promotion.
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

[`DecoratorBindings`](tests/contracts/DecoratorBindings.test-d.ts) checks explicit DTO/option,
handler-result, input-issue and endpoint-snapshot types. The genuine
[`CompiledBindings`](tests/data/compiler/CompiledBindings.ts) consumer additionally proves
emitted default-parameter positions, incompatible UserId rejection and constructor-free JSON binding.

[`ErrorsAndLogging`](tests/contracts/ErrorsAndLogging.test-d.ts) separately checks finite mapping
statuses, static options, immutable registration/log/problem types and hook shapes.
[`CompiledErrors`](tests/data/compiler/CompiledErrors.ts) proves genuine controller/endpoint error
decorators and logging exclusion through a compiled public-root consumer.
