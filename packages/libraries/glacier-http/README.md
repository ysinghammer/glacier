# @glacier/http

Native Node HTTP/1.1 request handling and explicit application-owned composition. The package
is native ESM, ES2023, root-only, and currently verified on Node `24.21.0`. Imports do not
start resources or activate compiler reflection. TypeScript and pnpm are workspace-owned.

## Current implementation boundary

The v1 implementation has local consumer/transport verification, **not release authorization or a portable performance claim**.
It provides explicit GET/POST/PUT/PATCH/DELETE handlers, all request binders, external
authentication with method-level public opt-out, bounded JSON bodies, strict repeatable
response contracts, HEAD/OPTIONS and Expect handling, alongside immutable cookies/requests.
There is no `inject`, raw request constructor, middleware or response/socket escape hatch.

Duplicate controller/method/status declarations and equivalent routes fail rather than
silently overwrite. Every parameter has an explicit binder and every success status has
an explicit `ApiResponse`. `void`/`undefined` means 204 only when declared; JSON endpoints
cannot silently succeed without a body. Controllers remain shared application-owned instances.

Static business mappings, metadata-only response logging, configurable limits and bounded native
transport/request/log draining and metadata-only OpenAPI 3.1 generation are implemented.
`HttpEndpointMetadata.read(Class)` and `server.registration` are deliberate
immutable public documentation contracts, with no instances/listeners/callbacks or OpenAPI dependency.
Concurrent close calls share one promise; closing during startup cancels the one-use listener.
The dedicated benchmark is separate from CI; see [measurement methodology](BENCHMARKS.md).
There is no browser compatibility or deployed-service E2E claim.

## Metadata-only OpenAPI

```ts
import { IsString } from "@glacier/schema";
import { ApiController, ApiGet, ApiResponse, HttpResponse, OpenApi } from "@glacier/http";

/** Declared boundary schema, never constructed during generation. */
class UserDto {
  @IsString() public name!: string;
}

/** Application-owned query contract; no HTTP dependency belongs in its business implementation. */
interface IUserQuery {
  /** Returns the user selected by the application operation. */
  read(): UserDto;
}

/** An adapter with dependencies unavailable during document generation. */
@ApiController("/users", { tags: ["users"] })
class UsersController {
  readonly #users: IUserQuery;
  /** Application composition supplies the service only when creating runtime controllers. */
  public constructor(users: IUserQuery) {
    this.#users = users;
  }
  /** Runtime declaration and documentation share one response contract. */
  @ApiGet("/current", { summary: "Read the current user" })
  @ApiResponse({ status: 200, type: UserDto, description: "The selected user" })
  public read(): HttpResponse<UserDto> {
    return HttpResponse.json(this.#users.read());
  }
}

const document = OpenApi.generate({
  controllers: [UsersController],
  info: { title: "Users API", version: "1.0.0" },
  authentication: {
    schemeName: "oidc",
    scheme: {
      type: "openIdConnect",
      openIdConnectUrl: "https://identity.example.com/.well-known/openid-configuration",
    },
  },
});
const json = JSON.stringify(document); // Application/build composition owns writing or serving it.
```

Supply **exactly one** of `controllers` (classes, never instances) or a created `server`.
Server mode reads only `server.registration`: classes, static global mappings and authentication
presence. The document's authentication must agree in both directions with that snapshot, before
listen, while listening and after close. Class mode uses explicit documentation authentication.
There is one named OIDC scheme; protected operations require it and `ApiPublic()` operations have
no security requirement. `ApiUserId()` cannot be documented without authentication. No scope/role
decorators, token verification, discovery/JWKS calls, listener, file writer, UI or document route.

The capabilities are organized under `src/request-handling/` and `src/openapi-generation/`.
OpenAPI consumes the deliberately curated request-handling metadata/registration contracts;
request handling never imports OpenAPI. There is no `server.openApiDocument()`. The sole public
entry is the package-root `index.ts`; capabilities have no inner barrels or public subpaths.

Generation validates shared endpoint contracts and prepares/freezes reachable DTO metadata through
`HttpEndpointMetadata.read`, but never constructs controllers/DTOs or runs defaults, transforms,
refinements or authentication/logging callbacks. Lazy references are metadata resolvers and do run.
Class declaration effects remain the consumer's responsibility. Returned records are detached JSON;
readonly types are not a runtime freeze claim.

Operation IDs default to `ControllerName.methodName`; route `operationId` overrides them. Tags,
summary, description, deprecated, examples and custom response-header annotations come from the
runtime decorators, not extra documentation-only decorators. Body examples and raw path examples
become named Example Objects. Successful DTO/array/204 declarations preserve status/body contracts.
Endpoint/controller/global mappings retain scope/class precedence, static safe problem details, and
same-status alternatives as `anyOf`. Framework failures and protected-route 401 are included; safe
issue components contain only location/path/code. HEAD and OPTIONS are implicit protocol behavior,
not generated operations; unmatched 404 and method 405/Allow are described at document level.

Stable `Input`/`Output` component suffixes preserve Rename wire names, direction-specific requiredness,
cycles and discriminator references. Public `IsObject` graph composition lets one schema generation
see all roots together, so distinct-class collisions across roots **and directions** fail even for
identical schema bytes. Synthetic graph names never appear as components. Duplicate operation IDs,
equivalent routes, inconsistent path names across methods, conflicting framework components,
ambiguous bound parameters and reserved/duplicate response-header declarations fail, never overwrite.
Exclusion removes document entries only; registered routes remain callable.

Query scalar arrays (including nullable arrays) use `form`/`explode: true` repeated keys; object fields
use `deepObject` with an explicit nested-tooling limitation. Nested repeated scalar arrays are supported,
but object arrays at any depth, indexed/empty brackets, dotted paths and embedded JSON are not.
Scalar tuples with at least two entries describe ordered repeated keys; singleton promotion is only
for `IsArray`, so smaller query tuples are rejected. Header/cookie/path DTO fields must be scalar.

Known structural/wire contradictions are checked via the public
`Schema.assertJsonSchemaCompatibility` operation: strict JSON Date/bigint/Map/Set inputs, unfaithful
literal/enum representations, altered structural fragments and missing/renamed/broad discriminator
fields fail. Descriptive annotations remain permitted. Arbitrary transforms/refinements, overlapping
`oneOf`, safe accessors, finite-number/collection identity semantics and all external tooling behavior
are not fully expressible. These are bounded contract/reference/JSON checks, **not complete OpenAPI
meta-schema validation**; no external validator dependency is installed.

Evidence: [OpenAPI scenarios](tests/scenarios/openapi-generation/README.md) and
[public type contracts](tests/contracts/OpenApiConfiguration.test-d.ts).

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
is diagnosed. Thrown/rejected logging is supervised once. `close()` uses one `shutdownTimeoutMs`
budget for transport, active request work (including disconnected hooks), and subsequent logging.
Timeout diagnoses and rejects close, while late settlements remain supervised.
Consumer promises cannot be forcibly cancelled.
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
  arbitrary consumer promises cannot be forcibly cancelled. Forced shutdown also aborts signals.

## Resource lifecycle and finite limits

`create` validates and snapshots composition without starting resources. `listen` is one-use,
supports port zero and native host defaults, and reports startup failures to the caller and
`onError` with startup context. Invalid port/host arguments do not consume startup. Bind failure
and cancellation release owned listener work; closed or previously started instances cannot restart.
`address()` returns only the actual current binding. `close()` is idempotent before, during and
after startup, including retaining the same rejection after a failed shutdown.

| `limits` option       |   Default |
| --------------------- | --------: |
| `bodyBytes`           | 1,048,576 |
| `headerBytes`         |    16,384 |
| `requestTargetBytes`  |     8,192 |
| `queryPairs`          |       100 |
| `queryDepth`          |         5 |
| `headersTimeoutMs`    |    10,000 |
| `requestTimeoutMs`    |    30,000 |
| `shutdownTimeoutMs`   |    10,000 |
| `pendingResponseLogs` |     1,000 |

All values are positive safe integers at most 2,147,483,647, with no zero/infinite disabling
switch. Explicit header timeout cannot exceed request timeout; omitted header timeout is capped
by a smaller configured request timeout. Native receive checks run at intervals no larger than
one second or the configured receive timeouts. Timers require a responsive Node event loop:
these are finite resource budgets, not hard real-time guarantees against blocking consumer code.

Native parser/header excess yields identity-free 431, malformed transport yields 400 or safe
closure, and incomplete headers can yield 408. Parsed target/body excess yields 414/413 where
the transport remains writable; complex/malformed queries yield 400. Header fields are never
silently truncated by Node's default count limit. Only chunked transfer coding is accepted.
If earlier work exists on a socket, parser errors close it rather than append an error status
into an in-flight body. There is no request-ID/auth/log promise for unparseable transport input.

Same-socket requests are sequenced. Rejected unread/partial/excess bodies close rather than
draining unrestricted data or dispatching a pipelined successor. Fully consumed schema-invalid
input can safely retain keep-alive framing. Expect preflight sends 100 only for an accepted body
read, never for rejection or a bodyless endpoint.

Close stops new acceptance immediately, drains transport and active work before pending logs,
then resolves so application composition can dispose dependencies. At the deadline it aborts
cooperative request signals, destroys owned sockets, diagnoses and rejects. A rejected close
does **not** establish that arbitrary controller/auth/log promises stopped using dependencies;
the application must coordinate those consumers before disposal. Even late failures stay supervised.
HTTP never invokes controller/service lifecycle methods or installs process signal handlers.

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

[`ServerLifecycle`](tests/contracts/ServerLifecycle.test-d.ts) checks readonly finite-limit and
listen/address/close types separately. Real lifecycle, framing, deadline and cooperative cancellation
evidence is linked in the request-handling scenario index.

## Compiled consumer and integration boundaries

The complete [consumer composition](tests/data/consumer/ConsumerComposition.ts) imports
`@glacier/reflection/register` **before importing decorated modules**. Both compiler flags
are enabled in [its actual compiler configuration](tsconfig.consumer.json). It is compiled
to native ESM by TypeScript, then executed in a separate Node process by
[ConsumerIntegration](tests/scenarios/request-handling/ConsumerIntegration.test.ts).
The assertions check actual recorded String/DTO parameter and field representations, not
Vitest's decorator emission. Imports must be ordered before declaration evaluation; registration
cannot recover earlier missed metadata. Do not assume erased interfaces/generics are runtime types.

Its [application operation](tests/data/consumer/UpdateItem.use-case.ts) has no Glacier/HTTP
imports and returns a typed authorization outcome. The [controller](tests/data/consumer/Items.controller.ts)
alone converts a denial to [a mapped business Error](tests/data/consumer/ItemAccess.error.ts).
Authentication establishes the actor; authorization still checks the actor against the requested
item in application code. Successful responses contain logical `label` data, which output validation
projects to `displayLabel`, removing internal fields before serialization. Invalid input does not
reach the operation. Safe cookie defaults and same-scope clearing are observed on the real wire.

### Standalone or optional existing IoC

Standalone composition explicitly constructs the operation and controller, passes shared controller
instances to `HttpServer.create`, and separately calls `listen`. No IoC dependency is needed.
Applications already using [the existing IoC library](../glacier-ioc/README.md) can instead register
the controller and its dependencies as DEFAULT providers in their own module, await
`GlacierContainer.create(ApplicationModule)`, and pass `container.get(ItemsController)` in
`controllers`. HTTP never calls `get`, resolves request scopes, discovers providers, constructs
controllers or runs container hooks. This is an optional composition recipe, not an HTTP dependency
or an assertion that this fixture runs IoC. If HTTP startup fails, application composition must
close resources that it already started and preserve both startup and cleanup failures.

### OIDC and diagnostics

The compiled fixture uses a **deterministic authentication stub**, not real token verification.
Production composition supplies `authentication.authenticate: (request) => verifier.authenticate(request)`
where the application-owned outbound adapter verifies credentials with its real identity provider
and returns a nonempty subject or `undefined`. Supply the static Bearer challenge separately.
HTTP performs no discovery/JWKS/network calls, cryptography, login, sessions or automatic proxy trust.
Document that same external contract with an explicit OpenID Connect scheme in `OpenApi.generate`;
server-mode generation checks whether authentication is configured, not whether a verifier is secure.

The fixture logs only the provided completion metadata and excludes session cleanup with
`ApiSkipResponseLogging`. Real logging adapters must avoid secrets even when handling their own
failure diagnostics: the diagnostic callback receives private application exceptions, unlike the
response-log whitelist. Logging promises are supervised and bounded; overflow/failure is observable,
not guaranteed delivery. HTTP drains them during close. Production diagnostics must be synchronous
and nonthrowing and should report safe context rather than raw error messages/stacks.

### Shutdown and offline documents

Application signal handling belongs outside HTTP. Await `server.close()` **before** disposing its
dependencies (or awaiting `container.close()` in optional IoC composition). A rejected close is not
proof that arbitrary consumer promises stopped; coordinate them before dependency disposal and keep
cleanup failures observable. Imports/create install no automatic signal handlers.

The fixture calls `OpenApi.generate({ controllers: [ItemsController], ... })` before constructing
the operation/controller. No dependency or OIDC endpoint is contacted. An application/build script
may serialize the returned JSON with `JSON.stringify` and explicitly write it using Node filesystem
APIs; HTTP supplies no file writer, UI or specification endpoint. Documentation can be generated
offline even when runtime service dependencies are unavailable.

## Dedicated benchmark

Run `pnpm exec turbo run bench --filter=@glacier/http -- 32 15000 3000 5` from the workspace root.
The arguments are concurrency, measured requests per sample, warmup requests and repeated samples.
The task is explicitly uncached and is **not** a dependency of `ci`; each run compiles authored
[Node-only support](tests/support/benchmarks/BenchmarkHarness.ts), starts a fresh server process,
then separate client processes for warmup and each sample. Raw JSON stays under ignored
`tests/artifacts/runs/`; generated support stays under ignored `tests/artifacts/benchmarks/`.
[BenchmarkHarness](tests/scenarios/request-handling/BenchmarkHarness.test.ts) exercises short real
correctness checks during CI, with no latency/throughput thresholds. See [BENCHMARKS.md](BENCHMARKS.md)
for measurement limits and the separately approved future release decision.

Local phase-08 verification completed on 2026-10-31: compiled consumers, public type contracts,
real loopback/lifecycle regressions and short benchmark correctness pass under the exact workspace
engines with 100% production-file V8 gates. The one-time same-machine Express comparison is recorded
in [BENCHMARKS.md](BENCHMARKS.md), including the separate add/measurement and removal commit identities;
Express and its types are not lasting dependencies. The comparison showed lower Glacier throughput,
not a speedup. Numeric release bounds are **proposed, not approved**, and no release/publication,
remote CI/security execution, deployed-stack or browser compatibility is implied by local acceptance.
