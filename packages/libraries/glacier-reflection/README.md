# @glacier/reflection

Typed, independently usable metadata for legacy TypeScript decorators and direct class annotations.
Native ESM, ES2023, no runtime dependencies, no DI container. Import **only the package root**:

```ts
import {
  DESIGN_PARAMETER_TYPES_METADATA,
  ListMetadataDefinition,
  MetadataDiscovery,
  RecordMetadataDefinition,
  ValueMetadataDefinition,
} from "@glacier/reflection";
```

The package currently has `private: true`; this is a workspace library, not a claim of npm publication.
The root export map supplies generated `dist/index.js` and `dist/index.d.ts`, with no CommonJS entry,
deep imports or public subpaths. Supported verification is Node.js 24 LTS (workspace 24.21.0) and
the Chromium revision installed by Playwright 1.63.0 (observed 153.0.8010.12).
Chromium evidence does not establish Firefox, WebKit or historical-browser compatibility.

The root exposes exactly **eight runtime values**: four classes (`ValueMetadataDefinition`,
`ListMetadataDefinition`, `RecordMetadataDefinition`, `MetadataBoundaryError`), one nonconstructible
`MetadataDiscovery` facade, and three predefined compiler metadata instances. Its **35 named type exports**
are erased and checked independently, not runtime-covered. The supporting discovery interface and internal
operation class are not named root exports; `Reflect.metadata` is an ambient compiler protocol, not a ninth export.

## Activation and compiler metadata

Every **runtime root import** automatically installs `Reflect.metadata` before decorated declarations execute.
A type-only import does not activate recording. Enable `experimentalDecorators` and `emitDecoratorMetadata`
in the consuming TypeScript configuration; modern standard decorators are not supported.
Import the root before modules containing decorated declarations. Metadata is emitted only where the compiler
actually emits it; importing later cannot recover earlier missed declarations.

`sideEffects: true` preserves activation when bundlers retain a runtime import, including a side-effect-only import:

```ts
import "@glacier/reflection";
```

Only `Reflect.metadata` is installed, not the rest of `reflect-metadata`. No resources, registry, background work
or consumer instances are started. The definitions are shared per evaluated module; repeated imports share state.
Two physical package copies in one realm are not coordinated implementations.

| Root constant                     | Emitted key         | Read value                |
| --------------------------------- | ------------------- | ------------------------- |
| `DESIGN_TYPE_METADATA`            | `design:type`       | `IRuntimeType`            |
| `DESIGN_PARAMETER_TYPES_METADATA` | `design:paramtypes` | `readonly IRuntimeType[]` |
| `DESIGN_RETURN_TYPE_METADATA`     | `design:returntype` | `IRuntimeType`            |

All three are **ordinary `ValueMetadataDefinition` instances**, supporting every ordinary definition operation.
The parameter array replaces an ancestor array in full, even when empty; it never concatenates.
`IRuntimeType` is a function/class representation or `undefined`, not proof of a usable dependency constructor.
Compiler ingestion validates the exact three keys and scalar/dense-array shapes, snapshots and freezes parameter
arrays before storage, and rejects malformed input atomically. Ordinary typed `set`/`decorator` calls on these
constants retain whole-value identity, including array identity; they do not gain compiler-specific copying.
Custom typed values are trusted: arbitrary JavaScript custom writes are not generally runtime-validated.

Interfaces, generic arguments, parameter names, source declaration kind and semantic signature equivalence
are not reconstructed. Built-in `Object`/`Function` representations do not supply erased dependency identity.

## Definitions and inheritance

Choose the value type and meaning once; later writes, reads and decorators infer it without casts:

```ts
const label = new ValueMetadataDefinition<string | undefined>("label");
const tags = new ListMetadataDefinition<string>("tags");
const people = new RecordMetadataDefinition<{ name: string }>("people");
```

Every constructor creates a distinct identity. Names are descriptive, not registry keys:
two definitions named `"label"` do not collide. Share the same object deliberately to share declarations.
Definitions are invariant and their classes are not interchangeable.

| Definition                    | Inherited lookup                                                             | Ownership                                                   |
| ----------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `ValueMetadataDefinition<T>`  | Nearest present whole value, including `undefined`                           | Original identity, no clone/freeze                          |
| `ListMetadataDefinition<T>`   | Ancestor-first concatenation, duplicates preserved                           | Copied and shallow-frozen outer arrays                      |
| `RecordMetadataDefinition<T>` | Ancestor-first string dictionary, nearest conflicting entry replaced in full | Copied and shallow-frozen null-prototype outer dictionaries |

Given base `["a", "b"]` and derived `["b", "c"]`, list lookup returns `["a", "b", "b", "c"]`.
Given base `{ service: { optional: true, label: "base" } }` and derived
`{ service: { optional: false } }`, a record returns the derived entry without `label`.
The same-shaped object under a value definition replaces the whole object instead.
Record entries are homogeneous and undeclared keys remain possibly absent, even without `noUncheckedIndexedAccess`.
Only own enumerable string keys contribute; symbols and inherited keys do not. Reserved string keys such as
`"__proto__"` and `"constructor"` are ordinary dictionary entries.

Each write replaces the previous **direct** declaration; accumulation occurs across class inheritance, not writes.
Empty list/record declarations are present but do not suppress ancestors. No reset, suppression, recursive merge
or deduplication API exists. Outer snapshots prevent caller reassignment/addition/removal from changing storage.
Contained objects preserve identity and may still mutate; no deep immutability is promised.
Accumulating decorator values snapshot when `decorator(value)` is created, not when invoked.

## Targets, addresses and outcomes

Writes and deletion require class constructors. Reads, presence and discovery also accept ordinary instances
as aliases for their class declarations, never per-instance storage.

| Address                                                                         | Meaning                               |
| ------------------------------------------------------------------------------- | ------------------------------------- |
| omitted / `{ kind: "class" }`                                                   | Class declaration                     |
| `{ kind: "member", member: "describe" }`                                        | Instance property, method or accessor |
| `{ kind: "member", side: "static", member: "describe" }`                        | Static member                         |
| `{ kind: "constructor-parameter", position: 0 }`                                | Individual constructor parameter      |
| `{ kind: "method-parameter", member: "describe", position: 0 }`                 | Instance method parameter             |
| `{ kind: "method-parameter", side: "static", member: "describe", position: 0 }` | Static method parameter               |

Member sides default to instance; numeric keys normalize to strings and symbol identities remain distinct.
Getter/setter annotations share a member location. Addresses are normalized without retaining caller records.
Direct addressing does not require a runtime member to exist on the prototype.

`set` and `setDynamic` return `{ isValid: true }` or a typed rejection.
`read`/`readDynamic` return a rejection, valid absence, or valid presence with the definition-owned value type.
`has`/`hasDynamic` return validated presence. `delete`/`deleteDynamic` remove only a direct declaration
and return validated `isDeleted`; deleting can reveal an ancestor declaration.
Read, presence and discovery default to inherited lookup; use `inheritance: "own"` for direct-only lookup.
For `locations`, supply the lookup option separately. Mutation addresses do not accept inheritance options.

```ts
@label.decorator("base")
class Base {
  @label.decorator("Describe")
  public describe(input: string): string {
    return input;
  }
}
class Derived extends Base {}

const written = label.set(Derived, undefined);
if (!written.isValid) throw new Error(written.code);
const instance = new Derived();
const result = label.read(instance);
if (!result.isValid) throw new Error(result.code);
if (result.isPresent) {
  const value: string | undefined = result.value; // Present undefined overrides Base.
  void value;
}
const member = label.read(instance, {
  kind: "member",
  member: "describe",
  inheritance: "own",
}); // Valid absence: Derived has no direct member declaration.
void member;
```

Two instances share declarations; subclass instances start at that subclass. Instance-owned `constructor`
properties are ignored, no getters are invoked and no consumer is constructed during lookup.
Plain objects, class prototypes and instance requests for static or individual constructor-parameter addresses
reject. The class-level emitted parameter array can still be read through an instance.
Prototype-based normalization cannot prove a constructor ran: objects with the same canonical class prototype
resolve identically. Structural TypeScript types do not prove genuine runtime instance identity.
Proxy/descriptor inspection exceptions remain observable, not converted to absence.

Checked methods (`set`, `read`, `has`, `delete`, `MetadataDiscovery.definitions`) anchor public member keys and
known fixed parameter tuples to the target. Optional tuple positions are checked; empty tuples admit none.
Open/rest lists expose `number`, overloads use the final exposed signature, callable fields are not distinguished
from method declarations by these types. Private/protected signatures, index signatures, erased/discovered names
use explicitly named dynamic methods, never fallback overloads.
Dynamic methods preserve value typing and validate targets/address shapes and safe nonnegative integer positions,
but do not prove finite keys, runtime member existence or tuple bounds from `.length`.
Parameter inheritance matches address and position only: it does not establish equivalent dependency meaning.
Use direct-only lookup when inherited parameter annotations are inappropriate.

## Discovery and decorators

`MetadataDiscovery` is a shallow-frozen plain operation record, not a class or an instance.
Its `definitions` and `definitionsDynamic` bindings are readonly and callable without a receiver;
existing `MetadataDiscovery.definitions(...)` calls are unchanged. Describe its type with
`typeof MetadataDiscovery`. It has no call/construct signature or public prototype, class-instance type
or subclassing API. Its internal class-backed implementation is not a consumer import.

`MetadataDiscovery.definitions(target, address?)` discovers actual definition identities at one exact address,
not all members. `MetadataDiscovery.definitionsDynamic(target, address?)` uses the same validation and
results without finite-key or tuple guarantees. `definition.locations(target, lookup?)` discovers
addresses carrying that definition.
Both directions deduplicate across ancestors, include present `undefined`/empty collections, and offer own mode.
Instances filter out static and individual constructor-parameter addresses; constructor discovery includes them.
Ordering is unspecified. Arrays and target-free canonical address records are shallow-frozen.

```ts
const discovered = label.locations(instance, { inheritance: "own" });
if (!discovered.isValid) throw new Error(discovered.code);
for (const address of discovered.addresses) {
  const annotation = label.readDynamic(instance, { ...address, inheritance: "own" });
  if (!annotation.isValid) throw new Error(annotation.code);
}
```

Discovery records use the full dynamic address union even for instance queries; they cannot establish a public
member key or exposed tuple position statically. Carry `"own"` into subsequent reads when needed.
Discovery inventories metadata-bearing locations, not every runtime member or parameter.

`definition.decorator(value)` supports class, instance/static property/method/accessor, constructor and method
parameter legacy locations. It returns `void` and never replaces a class, descriptor or method.
Legacy callback signatures do not offer direct checked-method key/tuple guarantees.

## DI foundation, not DI resolution

```ts
interface IRepository {
  load(): string;
}
const repositoryIdentity = Symbol("repository");
const dependency = new ValueMetadataDefinition<symbol>("dependency");

@label.decorator("consumer")
class Consumer {
  public constructor(@dependency.decorator(repositoryIdentity) readonly repository: IRepository) {}
}

const explicit = dependency.read(Consumer, {
  kind: "constructor-parameter",
  position: 0,
  inheritance: "own",
});
const emitted = DESIGN_PARAMETER_TYPES_METADATA.read(Consumer, {
  kind: "class",
  inheritance: "own",
});
if (!explicit.isValid) throw new Error(explicit.code);
if (!emitted.isValid) throw new Error(emitted.code);
// Explicit symbol supplies identity; the interface emits Object, not IRepository.
// Retrieval does not resolve a dependency or construct Consumer.
```

[Executable adoption example](tests/data/compiler/AdoptionExample.ts) checks these patterns, compiler member/return
representations, shallow ownership, aliases, deletion, discovery and position-only inheritance.
[Independent documentation type checks](tests/data/examples/AdoptionTypes.ts) consume generated root declarations
and guard rejected values/checked keys. Examples supplement the [public runtime suites](tests/scenarios/)
and [type contracts](tests/contracts/); they do not replace tests or coverage.

## Failures and recovery

Direct outcomes distinguish `invalid-target`, `invalid-address`, `invalid-position` and
`instance-address-not-supported` from absence/deletion failure. Rejections do not mutate declarations.
Decorators and the compiler protocol throw `MetadataBoundaryError`, with safe `code`/message and exceptional
`cause` where wrapped: `unsupported-compiler-key`, `invalid-compiler-value`, `invalid-decorator-target`,
`invalid-decorator-location`, `foreign-handler`, `reflect-unavailable`, `installation-failed`.
Exceptional custom snapshot or inspection errors remain thrown; handling a rejection is not a general exception catch.

A foreign `Reflect.metadata` handler (including another package copy) aborts import without replacing its
descriptor or invoking its accessor. Unrelated Reflect operations remain unchanged.
Correct the conflicting dependency/import arrangement and **restart the process/browser realm**.
Do not delete a foreign handler to force coexistence. There is no reset, uninstall or installation-toggle API.
Metadata is transient class-owned state, not durable storage.

## Workspace verification

Use Node 24.21.0 / pnpm 11.9.0. From the repository root:

```sh
pnpm --filter @glacier/reflection exec playwright install chromium
pnpm exec turbo run build type-check lint format-check test:prepare --filter=@glacier/reflection --force
node packages/libraries/glacier-reflection/tests/data/AdoptionExampleRun.ts
pnpm exec turbo run test --filter=@glacier/reflection --force
pnpm check
pnpm exec turbo run test --force
```

Package `test:prepare` compiles genuine legacy compiler fixtures and prepares independent distribution consumers.
Package `test` owns bounded native loopback delivery and runs real Vitest Node/Chromium projects with V8 coverage.
Do not invoke the native-realm suites without their server owner. Runtime discovery is only `tests/scenarios/`;
examples/data and independent `.test-d.ts` contracts are not runtime suites.
Artifacts go under ignored `tests/artifacts/`. Test/preparation tasks are uncached.

Vitest, coverage-v8 and browser-playwright are pinned to 5.0.3; Playwright is pinned to 1.63.0.
The unchanged gate requires 100% statements, branches, functions and lines overall and per relevant production file.
T-017 attempt 2 recorded 556 passing Node/Chromium cases and all-metric 100% mapped coverage under this
unchanged gate. Those are retained development results, not final current-revision acceptance.
[Story tasks](../../../.docs/Archive/glacier-reflection/Tasks.md) own exact revision/results and outstanding gates.
[Quality CI](../../../.github/workflows/quality.yml) configures frozen installation, Chromium-only installation,
`pnpm check` and always-retained root/library diagnostics; configuration is not evidence of remote execution.
Current-main integration, complete final checks, CI/Snyk, human acceptance and Git publication remain separate gates.
