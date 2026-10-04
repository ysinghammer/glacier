---
created: 2026-10-04
tags:
  - story
---

# Glacier reflection - Plan

This document owns implementation design and verification. It is **approved** against
[Brief.md](Brief.md), AC-001 through AC-027;
implementation is authorized within the [approval record](#approval).

## Approach

Implement one independently usable, technology-neutral library with npm identity `@glacier/reflection` at
`packages/libraries/glacier-reflection`. Expose native ESM JavaScript and TypeScript declarations through a single
package-root `index.ts`, compiled to `dist/index.js` and `dist/index.d.ts`. The export map exposes only `"."`;
no internal files, public subpaths, CommonJS entry, or DI facilities are part of this version.

Use definition-owned operations with embedded, plain-record address arguments. Consumers create `ValueMetadataDefinition<T>`,
`ListMetadataDefinition<T>`, or `RecordMetadataDefinition<T>` with `new`; each class fixes its declaration type,
retrieval type, and inheritance meaning. Each instance is a distinct definition identity. Direct operations receive
the target first and an optional address; omitting the address selects class metadata. Reads, presence checks, and
discovery accept a class constructor or an ordinary class instance, with instances resolving to their class's
declarations. Writes and deletion require constructors. Each definition discovers its own addresses through
`locations`; `MetadataDiscovery` discovers definitions at an address. Export the three compiler definitions as
predefined value-definition instances, not a design-metadata class. These API choices were selected explicitly by
the user during planning.

Instance arguments are lookup aliases, never annotation/storage targets. They introduce no per-instance metadata or
instance-value inspection. Brief.md documents this distinction in AC-027, including instance-read equivalence and
its rejection boundaries. Joint approval is recorded below.

Support Node.js 24 LTS and verify browser behavior only with the Chromium revision installed from the pinned
Playwright dependency, using native ESM and ES2023. Firefox and WebKit verification are outside the approved
scope; Chromium verification does not establish compatibility with other engines or historical browser versions.
Keep the public implementation independent of Node
APIs, DOM APIs, React, and other Glacier packages. Use no runtime dependencies.

Importing the root intentionally installs the compiler bridge on `Reflect.metadata`. Mark the package as
side-effectful so bundlers preserve that activation when a runtime import is retained. Type-only imports do not
activate it. Installation does not construct application resources, start background work, or install the rest of
the `reflect-metadata` API; this is a documented global integration effect, not accidental import behavior.

Material alternatives:

- A central Reflect-like custom API was not selected: it makes the association between a definition and its value
  less discoverable and risks callers choosing unrelated read types.
- A single generic definition class with static factories was replaced by three constructible classes: the class
  itself communicates replacement, list accumulation, or record accumulation and scopes every method to that contract.
- A separate `MetadataLocation` class was replaced by inline discriminated address records. This removes factory
  ceremony while keeping checked keys/positions, explicit static/instance separation, and reusable discovery output.
  Normalization and validation remain internal and run for each operation.
- Positional optional member/parameter arguments were not selected: address discriminants avoid ambiguous or invalid
  combinations and leave room for constructor and instance lookup restrictions.
- Decorators alone cannot supply direct operations, discovery, or checked addressing.
- Names or globally registered symbols as definition identity would collide between independent definitions.
- Per-value shape detection cannot distinguish replacement objects from accumulating dictionaries.
- A compatibility dependency or opt-in bridge would contradict the selected independent replacement and automatic
  recording requirements. Standard decorators and full source-type reconstruction remain excluded.

### Complete package-root public API

The following declarations specify the intended complete surface, not existing implementation. Each named contract
will have contract-focused JSDoc; classes use native private state. Supporting type aliases belong in their own
single-primary-export files where required by ADR-0003. No additional production symbol may be exported merely for
tests. Private constructors are not public creation APIs.

```ts
/** Class identity, including classes whose constructors are private/protected. */
export type IClass = Function & { readonly prototype: object };

/** A publicly visible constructor signature suitable for tuple inference. */
export type IConstructableClass<T extends object = object> = abstract new (
  ...arguments_: never[]
) => T;

export type IMetadataKind = "value" | "list" | "record";
export type IMetadataSide = "instance" | "static";

export interface IMetadataLookup {
  readonly inheritance?: "inherited" | "own";
}

/** Discovery exposes identity, not an untyped custom-write/read mechanism. */
export interface IMetadataDefinitionIdentity {
  readonly name: string;
  readonly kind: IMetadataKind;
}

export type IMethodKey<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends (...arguments_: never[]) => unknown ? K : never;
}[keyof T];

export type IMethodParameters<T> = T extends (...arguments_: infer P) => unknown ? P : never;

export type IStaticMemberKey<C extends IClass> = Exclude<keyof C, "prototype">;

/** Fixed tuples expose their numeric positions; open/rest lists expose number. */
export type IParameterIndex<T extends readonly unknown[]> = number extends T["length"]
  ? number
  : ITuplePosition<Exclude<keyof T, keyof (readonly unknown[])>>;

// Internal supporting type: not a package-root export.
type ITuplePosition<T> = T extends `${infer N extends number}` ? N : never;

export interface IMetadataClassAddress {
  readonly kind: "class";
}

export interface IInstanceMemberMetadataAddress<T extends object> {
  readonly kind: "member";
  readonly side?: "instance";
  readonly member: keyof T;
}

export type IInstanceMethodParameterMetadataAddress<T extends object> = {
  [K in IMethodKey<T>]: {
    readonly kind: "method-parameter";
    readonly side?: "instance";
    readonly member: K;
    readonly position: IParameterIndex<IMethodParameters<NonNullable<T[K]>>>;
  };
}[IMethodKey<T>];

export type IInstanceMetadataAddress<T extends object> =
  | IMetadataClassAddress
  | IInstanceMemberMetadataAddress<T>
  | IInstanceMethodParameterMetadataAddress<T>;

export interface IStaticMemberMetadataAddress<C extends IClass> {
  readonly kind: "member";
  readonly side: "static";
  readonly member: IStaticMemberKey<C>;
}

export type IStaticMethodParameterMetadataAddress<C extends IClass> = {
  [K in IMethodKey<C> & IStaticMemberKey<C>]: {
    readonly kind: "method-parameter";
    readonly side: "static";
    readonly member: K;
    readonly position: IParameterIndex<IMethodParameters<NonNullable<C[K]>>>;
  };
}[IMethodKey<C> & IStaticMemberKey<C>];

export type IConstructorParameterMetadataAddress<C extends IClass> = C extends IConstructableClass
  ? {
      readonly kind: "constructor-parameter";
      readonly position: IParameterIndex<ConstructorParameters<C>>;
    }
  : never;

export type IClassMetadataAddress<C extends IClass> =
  | IInstanceMetadataAddress<C["prototype"]>
  | IStaticMemberMetadataAddress<C>
  | IStaticMethodParameterMetadataAddress<C>
  | IConstructorParameterMetadataAddress<C>;

export type IMetadataReadAddress<R extends object> = R extends IClass
  ? IClassMetadataAddress<R>
  : IInstanceMetadataAddress<R>;

export type IDynamicInstanceMetadataAddress =
  | IMetadataClassAddress
  | { readonly kind: "member"; readonly side?: "instance"; readonly member: PropertyKey }
  | {
      readonly kind: "method-parameter";
      readonly side?: "instance";
      readonly member: PropertyKey;
      readonly position: number;
    };

export type IDynamicClassMetadataAddress =
  | IDynamicInstanceMetadataAddress
  | { readonly kind: "member"; readonly side: "static"; readonly member: PropertyKey }
  | {
      readonly kind: "method-parameter";
      readonly side: "static";
      readonly member: PropertyKey;
      readonly position: number;
    }
  | { readonly kind: "constructor-parameter"; readonly position: number };

export type IDiscoveredMetadataAddress = ICanonicalMetadataAddress<IDynamicClassMetadataAddress>;

// Internal supporting type: not a package-root export.
type ICanonicalMetadataAddress<T> = T extends { readonly member: PropertyKey }
  ? Omit<T, "member"> & { readonly member: string | symbol }
  : T;

export type IMetadataAddressRejectionCode =
  "invalid-target" | "invalid-address" | "invalid-position" | "instance-address-not-supported";

export interface IMetadataAddressRejection {
  readonly isValid: false;
  readonly code: IMetadataAddressRejectionCode;
}

export type IMetadataWriteResult = IMetadataAddressRejection | { readonly isValid: true };
export type IMetadataRead<T> =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly isPresent: false }
  | { readonly isValid: true; readonly isPresent: true; readonly value: T };
export type IMetadataPresenceResult =
  IMetadataAddressRejection | { readonly isValid: true; readonly isPresent: boolean };
export type IMetadataDeletionResult =
  IMetadataAddressRejection | { readonly isValid: true; readonly isDeleted: boolean };
export type IMetadataLocationsResult =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly addresses: readonly IDiscoveredMetadataAddress[] };
export type IMetadataDefinitionsResult =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly definitions: readonly IMetadataDefinitionIdentity[] };

export interface ILegacyMetadataDecorator {
  <C extends IClass>(target: C): void;
  (target: object, member: string | symbol): void;
  <T>(target: object, member: string | symbol, descriptor: TypedPropertyDescriptor<T>): void;
  (target: object, member: string | symbol | undefined, position: number): void;
}

/** Internal shared signatures/behavior; not a package-root export. */
abstract class MetadataDefinitionOperations<
  in out TDeclaration,
  in out TValue,
> implements IMetadataDefinitionIdentity {
  #private;
  protected constructor(name: string);
  readonly name: string;
  abstract readonly kind: IMetadataKind;

  set<C extends IClass>(
    target: C,
    value: TDeclaration,
    address?: IClassMetadataAddress<NoInfer<C>>,
  ): IMetadataWriteResult;
  setDynamic(
    target: IClass,
    value: TDeclaration,
    address?: IDynamicClassMetadataAddress,
  ): IMetadataWriteResult;
  read<R extends object>(
    target: R,
    address?: IMetadataReadAddress<NoInfer<R>> & IMetadataLookup,
  ): IMetadataRead<TValue>;
  readDynamic(
    target: object,
    address?: IDynamicClassMetadataAddress & IMetadataLookup,
  ): IMetadataRead<TValue>;
  has<R extends object>(
    target: R,
    address?: IMetadataReadAddress<NoInfer<R>> & IMetadataLookup,
  ): IMetadataPresenceResult;
  hasDynamic(
    target: object,
    address?: IDynamicClassMetadataAddress & IMetadataLookup,
  ): IMetadataPresenceResult;
  delete<C extends IClass>(
    target: C,
    address?: IClassMetadataAddress<NoInfer<C>>,
  ): IMetadataDeletionResult;
  deleteDynamic(target: IClass, address?: IDynamicClassMetadataAddress): IMetadataDeletionResult;
  locations(target: object, lookup?: IMetadataLookup): IMetadataLocationsResult;
  decorator(value: TDeclaration): ILegacyMetadataDecorator;
}

export class ValueMetadataDefinition<in out T> extends MetadataDefinitionOperations<T, T> {
  #private;
  constructor(name: string);
  readonly kind: "value";
}

export class ListMetadataDefinition<in out T> extends MetadataDefinitionOperations<
  readonly T[],
  readonly T[]
> {
  #private;
  constructor(name: string);
  readonly kind: "list";
}

export class RecordMetadataDefinition<in out T> extends MetadataDefinitionOperations<
  Readonly<Record<string, T>>,
  Readonly<Record<string, T | undefined>>
> {
  #private;
  constructor(name: string);
  readonly kind: "record";
}

/** Supporting facade contract, not an additional named package-root export. */
interface IMetadataDiscovery {
  readonly definitions: <R extends object>(
    target: R,
    address?: IMetadataReadAddress<NoInfer<R>> & IMetadataLookup,
  ) => IMetadataDefinitionsResult;
  readonly definitionsDynamic: (
    target: object,
    address?: IDynamicClassMetadataAddress & IMetadataLookup,
  ) => IMetadataDefinitionsResult;
}

/** Nonconstructible, shallow-frozen operation record; behavior remains in domain classes. */
declare const metadataDiscovery: IMetadataDiscovery;
export { metadataDiscovery as MetadataDiscovery };

/** Runtime representations may be callable, constructable, or unavailable. */
export type IRuntimeType = ((...arguments_: never[]) => unknown) | IClass | undefined;

export type ICompilerMetadataRejectionCode =
  | "unsupported-compiler-key"
  | "invalid-compiler-value"
  | "invalid-decorator-target"
  | "invalid-decorator-location";

export interface ICompilerMetadataDecorator {
  <C extends IClass>(target: C): void;
  (target: object, member: string | symbol, descriptor?: unknown): void;
}

export const DESIGN_TYPE_METADATA = new ValueMetadataDefinition<IRuntimeType>("design:type");

export const DESIGN_PARAMETER_TYPES_METADATA = new ValueMetadataDefinition<readonly IRuntimeType[]>(
  "design:paramtypes",
);

export const DESIGN_RETURN_TYPE_METADATA = new ValueMetadataDefinition<IRuntimeType>(
  "design:returntype",
);

export type IMetadataBoundaryErrorCode =
  | ICompilerMetadataRejectionCode
  | "foreign-handler"
  | "reflect-unavailable"
  | "installation-failed";

export class MetadataBoundaryError extends Error {
  constructor(code: IMetadataBoundaryErrorCode, options?: ErrorOptions);
  readonly code: IMetadataBoundaryErrorCode;
}

declare global {
  namespace Reflect {
    function metadata(key: unknown, value: unknown): ICompilerMetadataDecorator;
  }
}
```

The ambient `Reflect.metadata` function is an intentional platform-integration declaration, not another importable
root function or a general custom-metadata entry point. The barrel exports exactly 35 named erased types and eight
runtime values: four runtime classes (`ValueMetadataDefinition`, `ListMetadataDefinition`,
`RecordMetadataDefinition`, and `MetadataBoundaryError`), the nonconstructible `MetadataDiscovery` facade,
and the three predefined metadata constants above. IMetadataDiscovery describes the facade without adding a
named root type export. Internal supporting source exports do not enlarge the curated root API.
The non-exported shared base shows the full inherited operation signatures once; each public definition class
specializes them to its value/element contract. Consumers neither import nor construct that base.
No `MetadataLocation`, unified `MetadataDefinition`, `DesignMetadata` class, static definition factory, public untyped `record` method,
`getMetadata`, `defineMetadata`, installation toggle, reset, or uninstall API is planned.

### Public contract details

**Nonconstructible discovery facade.** The approved 2026-10-04 revision replaces only the exported
private-constructor discovery class representation. Keep `MetadataDiscovery.definitions(...)` and
`MetadataDiscovery.definitionsDynamic(...)`, their exact generic `NoInfer`/readonly result contracts, and all
discovery values, validation, inheritance and exceptional behavior unchanged. Expose a shallow-frozen plain record
whose two operation properties are readonly, with no call or construct signature and no public prototype/instance
API. Consumers describe it with `typeof MetadataDiscovery`; the former class instance type, subclassing,
class identity and constructor/prototype introspection are not preserved public promises. The private-constructor
class was never an approved consumer construction API. Changing this export kind is material and explicitly
approved below, not claimed as an invisible internal refactor.

Implement the existing substantial behavior as static methods on the purpose-specific internal domain class
`MetadataDiscoveryOperations` in `src/domain/MetadataDiscoveryOperations.ts`, retaining normalization and storage
delegation. Give it no explicit unused constructor or artificial instance state. In the existing
`src/domain/MetadataDiscovery.ts`, declare the supporting IMetadataDiscovery contract and a camelCase
`metadataDiscovery` binding initialized with `Object.freeze` over direct references to those static methods;
export that binding as `MetadataDiscovery`. Methods must not require `this` binding or facade mutation.
This record contains operation references, not standalone implementation functions. ADR-0003 already permits
plain data contracts and requires class-first behavior: no ADR exception or change is needed. Keep one primary
export per implementation file; the root re-export may remain unchanged, or change only if required to retain
the exact public alias. This introduces one internal behavior-class source file, not a fifth root runtime class
or a 36th named erased root export. Collect both files at the unchanged 100% per-file/overall thresholds.

Before replacement, add public-root type checks for the readonly/noncallable/nonconstructible facade and observe
meaningful type red for the newly approved readonly operation bindings against the existing writable static
methods; missing-symbol failures are not red. Preserve the existing nonconstruction check and every checked/dynamic
address guarantee. Add public runtime freeze/binding-stability assertions before implementation and observe their
intended failure, without constructing or invoking private helpers. Independent generated-declaration checks and
Node/Chromium discovery regression assertions must then pass, with actual mapped 100% coverage of both discovery
files. No constructor sentinel, singleton, reset, testing hook, ignore, exclusion or weaker threshold is authorized.
README/JSDoc and distribution/count companions must be renewed under separately bounded T-018 ownership after
implementation; this prerequisite repair does not edit them.

**Definitions and operations.** Each constructor's `name` argument is a descriptive label, with no uniqueness or registry semantics.
Every `new` expression creates a distinct identity, even for the same name, class, and value type. Choose the class
and supply its value/element type once when defining metadata. `ValueMetadataDefinition<T>` writes, reads, and
decorates whole values of `T`; `ListMetadataDefinition<T>` writes/decorates readonly arrays of `T` and reads readonly
arrays; `RecordMetadataDefinition<T>` writes/decorates homogeneous string dictionaries of `T` and reads a readonly
dictionary whose entries may be absent. Method signatures cannot switch the definition's aggregation meaning or accept another class's
declaration shape. The three classes have distinct runtime-private brands and invariant type parameters so assignment
cannot widen a definition's write contract or interchange definition classes.
Method type parameters describe only the supplied target and its checked address; callers cannot independently
choose a metadata retrieval type. `set(target, value, address?)` replaces one direct declaration; it does not append
to an earlier write. `delete(target, address?)` reports whether it removed a direct declaration and never accepts
inheritance options. All direct operations validate target/address inputs and return an explicit `isValid` outcome;
invalid inputs are neither absence nor unsuccessful deletion. Value typing remains fixed by the definition.
`read`, `has`, and discovery default to `"inherited"`; `"own"` means direct-only. A read result's presence
discriminant, after validating the result, distinguishes absence from a present `undefined`. Record reads explicitly include `undefined` in their
index result, even for consumers that do not enable `noUncheckedIndexedAccess`.

**Embedded addresses.** A constructor or instance is the first argument, not a field in an address object.
Omitting the address selects class metadata; `{ kind: "class" }` is its explicit equivalent.
Member and method-parameter addresses default `side` to `"instance"`; `"static"` must be explicit.
`kind` distinguishes member, constructor-parameter, and method-parameter addresses. The optional `inheritance`
field belongs to read/presence/definition-discovery address arguments; `locations` accepts its lookup mode separately.
No location factory, public location object, or prevalidated-address brand is required. Operations copy/normalize
address fields before use and do not retain caller-owned address records.

The `IClass` use of the built-in `Function`
contract is restricted to class identity: it accommodates private/protected constructors without claiming their
argument tuple is accessible. It is not used to invoke a constructor or weaken custom metadata values. Runtime
constructor normalization requires a constructable function with a canonical class prototype. Mutation inputs
must be constructors: instances, plain objects, arrow functions, and unrelated prototype objects are rejected.
Normalization must not construct consumer classes or execute their property getters.

Checked operations infer keys from the exact target type, including inherited public, numeric, and symbol keys.
`NoInfer` prevents the address from widening the inferred target to accommodate a misspelled member or invalid tuple
position. The constructor branch infers instance keys from its prototype and static keys from its constructor type.
The instance branch infers only instance keys from the supplied instance type.
Numeric keys normalize to their equivalent string property keys. Static `"prototype"` is not a supported member
location. Private/protected member names inaccessible to the caller, string index signatures, erased class types,
and dynamically discovered names use the explicitly named `setDynamic`, `readDynamic`, `hasDynamic`, `deleteDynamic`,
or `MetadataDiscovery.definitionsDynamic` operations. These do not claim finite-key or tuple-bound guarantees and
must not be permissive fallback overloads of the checked methods.
Dynamic read-side methods accept the complete address union because runtime/erased targets and discovered records
cannot always establish a constructor-versus-instance category statically. They validate that category at runtime;
static or constructor-parameter addresses with actual instance targets return `"instance-address-not-supported"`.
Checked instance calls reject those combinations at compile time as well.
Method parameter inference uses callable member types, not source-code introspection. TypeScript cannot distinguish
a callable field from a method declaration through these types; only real method declarations support parameter
decorator syntax. Accessor getter/setter metadata shares its one member location, matching legacy decorators.

Known fixed tuples, including optional positions, reject out-of-range literal indices at compile time. Empty tuples
admit no positions. Open/rest parameter lists admit `number`; overloaded methods use TypeScript's exposed final
signature, not a reconstruction of every overload. Private/protected constructor parameters use dynamic operations
with the constructor as target. Every direct operation rejects negative, fractional, nonfinite, or unsafe-integer
positions through its typed outcome. Dynamic positions are not checked against `.length`, because defaults, rest
parameters, and erasure make that an unsound signature bound. Direct addressing does not require the runtime property to exist: declared
fields may not exist on the prototype before construction.

Invalid target, malformed/unsupported address, invalid position, and an instance-only lookup attempting a static or
constructor-parameter address have distinct rejection codes. Checked and dynamic direct operations use the same
normalizer and outcome contracts. Neither form silently substitutes a supported address, performs a mutation on
rejection, or reports an invalid input as a missing declaration. Decorator boundaries cannot return those outcomes
and translate invalid targets/addresses to `MetadataBoundaryError`. Exceptional failures remain thrown errors.

**Instance lookup.** `read`, `readDynamic`, `has`, `hasDynamic`, `locations`, and both definition-discovery methods
accept an ordinary class instance as a read-side convenience. Resolve the nearest canonical class prototype and
perform the same lookup as its constructor: two instances of a class share declarations, and a subclass instance
starts at that subclass. An instance argument never inspects instance property values, binds or invokes methods,
allocates storage for the instance, or overrides class annotations.

Instance arguments support class metadata, instance-member metadata and instance-method-parameter metadata.
Static addresses and individual constructor-parameter addresses require an actual constructor, on both checked and
dynamic paths. Reading `DESIGN_PARAMETER_TYPES_METADATA` with an instance and no address is still allowed: that reads the
class-level emitted array, not an individual constructor parameter or a statically inferred constructor tuple.

Do not trust `instance.constructor`, which may be shadowed. Inspect the prototype chain and own data descriptors
for a constructor whose canonical `.prototype` matches the inspected prototype; stop before Object.prototype.
Reject plain objects, null-prototype objects, and prototype objects supplied instead of instances. Inherited
own-only lookup means direct declarations on the resolved class, not properties on the object. Structural typing
cannot prove that a value is a genuine instance, and prototype inspection cannot prove its constructor actually ran;
objects with the same canonical class prototype resolve identically. Document these bounds without claiming
unforgeable instance identity. Proxy/inspection exceptions remain observable.

**Decorators.** `definition.decorator(value)` validates the custom value statically and returns a legacy callable
usable at every location in AC-002. Class/member/descriptor/parameter overloads intentionally follow TypeScript's
legacy invocation shapes. The callback normalizes the constructor or canonical prototype to the same address used
by direct operations. Its return is `void`: it never replaces a class, descriptor, or method. Legacy callback types
cannot check a source-written member name or parameter tuple as precisely as direct checked operations; do not
advertise that additional guarantee. Copy accumulating inputs when the decorator is created, so caller mutation
between creation and invocation cannot change the annotation it represents. Replacement values retain identity.

**Inheritance and discovery.** Traverse class ancestry, not arbitrary prototype chains on instances. Class,
instance/static member, constructor parameter, and instance/static method parameter addresses remain separate.
Replacement stops at the nearest present declaration, including `undefined`; lists concatenate ancestor-first
without deduplication; records merge ancestor-first by string entry key with whole-entry nearest replacement.
An empty accumulating declaration is present but does not suppress ancestors. Parameter inheritance matches
position and address, never inferred signature compatibility.

`MetadataDiscovery.definitions(target, address?)` returns the actual definition identities once each at an exact
address, in a typed validation result. It does not scan every member when the address is omitted.
`definition.locations(target, lookup?)` returns all addresses carrying that definition, in a typed result.
For constructor targets this includes class, both member sides and all parameter kinds. For instance targets it
includes only class and instance-member/method-parameter addresses; static and constructor-parameter addresses
remain discoverable by supplying the constructor.

Results are plain discriminated records without a target reference; read them with
`definition.readDynamic(target, address)`. Discovery cannot promise names are public statically known keys or that
positions match the queried target's exposed tuple, so discovered records do not bypass checked-method guarantees.
The result address type is deliberately the complete canonical union, even for instance queries: runtime filtering
does not become an unsound conditional type when a constructor is supplied through an erased `object` reference.
To preserve own-only value retrieval, also pass `inheritance: "own"` in the subsequent read address.
Inherited addresses are relative to the queried/resolved class, not returned ancestor constructors, and repeated
ancestor addresses appear only once.
Discovery includes present `undefined` and empty collections, and excludes addresses with no remaining declaration.
Discovery array ordering is not promised; list value ordering is. Returned arrays and addresses are shallow-frozen.
Outputs normalize numeric names to strings and include explicit member sides. Definition-owned location discovery
uses its receiver's identity, not a supplied name. There is no global class enumeration or method-only inventory:
properties, methods and accessors share the member address kind.

**Compiler definitions and bridge.** The three exported constants are ordinary `ValueMetadataDefinition` instances,
shared per evaluated package module, with kind `"value"` and the same public methods as consumer-defined values.
In particular, `DESIGN_PARAMETER_TYPES_METADATA` is a whole-array replacement value, not a `ListMetadataDefinition`;
using list accumulation would violate AC-021. A separately constructed definition named `"design:type"` is still
unrelated. The bridge maps only the exact keys `"design:type"`, `"design:paramtypes"`, and `"design:returntype"` to
these constants; no registry lookup by descriptive name is introduced.
Scalar representations must be functions or `undefined`; parameter representations must be dense arrays containing
only those values. This includes `Object`, `Function`, built-in constructors, and an unavailable representation,
without asserting that each value is a usable dependency constructor.

The compiler bridge accepts canonical class or member addresses; its Reflect invocation shape has no individual
parameter address. TypeScript normally emits `design:type` and `design:returntype` on members and
`design:paramtypes` on classes or methods. Do not turn those emission conventions into a claim of reconstructed
source kind: the untyped boundary guarantees a supported address and runtime shape. The predefined definitions
also expose the ordinary typed direct/decorator operations at supported library locations; explicit annotations
outside TypeScript's emission locations are not evidence that TypeScript emitted them.
The compiler bridge validates and snapshots the complete emitted parameter array before storing it, then freezes
that snapshot. Its inheritance replaces the whole array, including an empty descendant array. Ordinary typed
`set` and `decorator` calls on the constants follow their value-definition contracts: they retain the supplied value
identity, including whole arrays, and do not acquire hidden compiler-specific copying or accumulation behavior.
The array type is readonly; callers requiring runtime-frozen direct annotations can supply their own frozen array.

The internal compiler recorder returns a discriminated rejection for expected invalid key/value/target/address inputs
without mutation. It is not a package-root API; `Reflect.metadata` is the sole supported untyped compiler entry.
The global factory rejects an unsupported key/value immediately with `MetadataBoundaryError`;
its returned callback validates the target/address and translates a rejected write to that error. Compiler-generated
invocation therefore never silently drops a rejection. `MetadataBoundaryError` has a code-derived safe message;
it does not embed metadata values, consumer source, or secrets. Exceptional failures retain `cause` when wrapped.

### Representative consumer usage

Examples are intended to become checked documentation fixtures, not claims that a package already exists.

```ts
import {
  DESIGN_PARAMETER_TYPES_METADATA,
  ListMetadataDefinition,
  MetadataDiscovery,
  RecordMetadataDefinition,
  ValueMetadataDefinition,
} from "@glacier/reflection";

const label = new ValueMetadataDefinition<string | undefined>("label");
const tags = new ListMetadataDefinition<string>("tags");
const people = new RecordMetadataDefinition<{ readonly name: string }>("people");

@label.decorator("base")
class Base {}

@tags.decorator(["derived"])
class Derived extends Base {
  @label.decorator("Describe")
  public describe(input: string): string {
    return input;
  }
}

const written = label.set(Derived, undefined);
if (!written.isValid) {
  throw new Error(written.code);
}
const instance = new Derived();
const result = label.read(instance);
if (!result.isValid) {
  throw new Error(result.code);
}
if (result.isPresent) {
  // Present undefined is not absence and does not reveal Base's label.
  const value: string | undefined = result.value;
  console.log(value);
}
const memberLabel = label.read(instance, {
  kind: "member",
  member: "describe",
  inheritance: "own",
});
if (!memberLabel.isValid) {
  throw new Error(memberLabel.code);
}
console.log(memberLabel);
const peopleWritten = people.set(Derived, { owner: { name: "Ada" } });
if (!peopleWritten.isValid) {
  throw new Error(peopleWritten.code);
}
const persons = people.read(instance);
if (!persons.isValid) {
  throw new Error(persons.code);
}
if (persons.isPresent) {
  console.log(persons.value["missing"]); // Possibly absent.
}
const definitions = MetadataDiscovery.definitions(instance);
if (!definitions.isValid) {
  throw new Error(definitions.code);
}
const discovered = tags.locations(instance);
if (!discovered.isValid) {
  throw new Error(discovered.code);
}
for (const address of discovered.addresses) {
  const tagValues = tags.readDynamic(instance, address);
  if (!tagValues.isValid) {
    throw new Error(tagValues.code);
  }
  console.log(address, tagValues);
}
const deleted = label.delete(Derived);
if (!deleted.isValid) {
  throw new Error(deleted.code);
}
// Removes only Derived's label; Base becomes visible to both instance reads.
console.log(label.read(instance), label.read(new Derived()));

interface IRepository {
  load(): string;
}
const repositoryIdentity = Symbol("repository");
const dependency = new ValueMetadataDefinition<symbol>("dependency");

@label.decorator("consumer")
class Consumer {
  constructor(@dependency.decorator(repositoryIdentity) readonly repository: IRepository) {}
}

const annotation = dependency.read(Consumer, {
  kind: "constructor-parameter",
  position: 0,
  inheritance: "own",
});
if (!annotation.isValid) {
  throw new Error(annotation.code);
}
const emitted = DESIGN_PARAMETER_TYPES_METADATA.read(Consumer);
if (!emitted.isValid) {
  throw new Error(emitted.code);
}
console.log(annotation, emitted);
// The explicit symbol supplies identity. The interface's emitted representation
// does not reconstruct IRepository, and no resolver or DI token class is needed.
```

## Affected areas

| Area                                                             | Intended change                                                                                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/libraries/glacier-reflection`                          | Manifest, root barrel, TypeScript build/declarations, implementation, public-contract tests, coverage, examples, and package README.                               |
| Library `src/domain/`                                            | Definition identity and semantics, typed embedded addresses/outcomes, constructor/instance normalization, class-local metadata storage, inheritance and discovery. |
| Library `src/infrastructure/adapters/inbound/`                   | Legacy decorator normalization, checked compiler-write boundary, automatic global Reflect integration.                                                             |
| Library `tests/`                                                 | Runtime scenarios/data, positive and negative type contracts, real emitted compiler fixtures, isolated-process/realm integration controls, generated artifacts.    |
| Root manifest, lockfile, `turbo.json`                            | Include library tests/coverage in complete local gates; declare shared test/build prerequisites without aliases or public subpaths.                                |
| `.github/workflows/quality.yml`                                  | Run library tests and browser installation, preserve library coverage/diagnostics, maintain existing root tooling/catalog gates.                                   |
| Architecture dependency notes, Engineering guidance and CI notes | Record approved non-React browser-test dependency scope, library commands, runtime baselines, public API and global activation obligations.                        |
| Story companions and indexes                                     | Maintain Brief.md AC-001 through AC-027, Tasks.md, approval links and the story index; archive the story during closure.                                           |

The capability is metadata reflection, including its compiler/decorator adapters. It needs no application
orchestration layer, consumer business domain, bootstrap, persistence adapter, or speculative DI port.
Root composition must invoke the installation adapter; the domain must not depend on global Reflect integration.

## Implementation steps

- **P-001 - Confirm design and prerequisites:** Obtain explicit joint approval of this plan and AC-001 through AC-027,
  including the brief's constructor-only annotation and instance-lookup boundaries.
  Record dependency decisions and required documentation-scope updates; create execution tasks and index the story
  through their authorized document workflows. Preserve the confirmed existing story branch and brief.
  Dependencies: none.
- **P-002 - Establish library tooling:** Scaffold the package and root-only ESM export map, strict compiler settings,
  emitted declarations, local Vitest Node/browser projects, type-contract discovery, coverage and artifact paths.
  Add approved development dependencies, lockfile changes, Turbo test tasks, local gate integration, and CI browser
  installation/coverage retention. Demonstrate that an intentionally uncovered production path fails the 100% gate.
  No runtime API implementation precedes its contract failure. Dependencies: P-001.
- **P-003 - Establish definitions and embedded-address contracts test-first:** Write positive/negative type fixtures
  and package-root runtime cases for each definition constructor, scoped checked/dynamic methods, discriminated
  addresses, numeric validation, explicit rejected outcomes, constructor-only mutation, and constructor/instance
  lookup equivalence. Include shadowed constructors, subclass resolution, plain/prototype-object rejection and
  instance static/constructor-parameter restrictions. For the first declaration bootstrap only, author meaningful
  accepted-use/rejected-misuse public-root type fixtures before the production declarations they cover, then add
  the exact approved nonbehavioral declarations and verify their intended contracts/diagnostics. Preserve that
  order as evidence under the bounded ADR-0006 exception. Observe meaningful runtime failures before implementing private storage,
  normalization and public contracts. Validate no unsafe widening, cross-class interchange, independent result-type
  selection, or permissive checked-method fallback. Dependencies: P-002.
- **P-004 - Implement inheritance and ownership test-first:** Add failing public-contract cases for multi-level
  replacement, list/record accumulation, repeated direct writes, empty declarations, shallow copy/freeze behavior,
  deletion and parameter inheritance boundaries; implement them without deep copying or signature assumptions.
  Dependencies: P-003.
- **P-005 - Implement decorators and discovery test-first:** Add failing real legacy-decorator fixtures covering all
  valid locations, including private/protected constructors/members, numeric/symbol keys, static/instance separation,
  accessor sharing, definition-owned address discovery and address-scoped definition discovery in both lookup modes.
  Include instance discovery filtering and reads of discovered dynamic records. Implement normalization and discovery;
  demonstrate direct/decorator equivalence without constructing consumers during normalization. Dependencies: P-004.
- **P-006 - Implement compiler integration test-first:** Compile real fixture TypeScript with
  `experimentalDecorators` and `emitDecoratorMetadata`. Observe missing automatic-recording failures in fresh
  processes/realms, then implement the three predefined value-definition constants, internal atomic checked writes,
  Reflect installation, rejection translation, foreign-handler conflict and unrelated-Reflect preservation.
  Verify that constants use ordinary class-scoped methods and whole-value replacement. Re-run all previously established
  custom contracts with actual emitted metadata present. Dependencies: P-005.
- **P-007 - Verify distribution and document adoption:** Exercise generated JS/declarations from the root export map
  in independent Node and browser consumers, complete executable usage/DI-foundation examples, document runtime
  bounds and intentional import effects, and update directly affected lasting notes. Deep import/subpath attempts
  must fail. Dependencies: P-006.
- **P-008 - Prepare current-revision review:** Integrate freshly fetched current `origin/main` by merge where needed,
  renew all local gates and manual ADR/public-contract review, complete implementation/verification evidence and
  archive/index/link preparation. Obtain separate commit and publication authorization, passing CI/Snyk evidence,
  human acceptance and explicit merge authorization for the unchanged current revision. Verify GitHub's merge
  confirmation rather than treating archival location as delivery. Dependencies: P-007.

Within P-003 through P-007, repeat meaningful red/green/refactor for every new runtime behavior and every type
behavior change after the first declaration bootstrap. Only that initial bootstrap uses the fixture-first,
post-declaration type verification authorized below; it does not claim initial type red. Tooling/bootstrap failures
and missing symbols alone do not count as contract failures. Steps describe sequencing, not completed progress;
Tasks.md owns execution status and evidence.

## Data, lifecycle, and failure handling

Store declarations in a package-private `WeakMap` keyed by the owning class, with maps for normalized addresses
and definition identities beneath each entry. A class-local map supports discovery without a global strong class
registry. Embedded/discovered addresses carry no class/instance reference. Reads of instances resolve a constructor
and use only its class-owned entries; there is no instance-keyed storage or instance registry. Dropping consumer
references allows class-local storage to be collected. No public garbage-collection timing promise or GC-dependent
acceptance test is required.

Use distinct native private brands to prevent forged definitions and interchange between definition classes;
preserve generic invariance in emitted declarations as well as source types. Validate/normalize caller-owned address
records for every operation, with a class default and an explicit instance-side default for member addresses.
Malformed kinds, side/position combinations, unsupported targets and invalid positions produce typed rejections.
Mutation rejects instance targets and inheritance options before changing declarations. Read-side instance requests
reject static and constructor-parameter addressing before lookup.

Target/prototype descriptor inspection must not read instance values or execute target getters; shadowed instance
`constructor` properties are ignored. Prototype objects are not instance aliases. An internal normalization failure
becomes the public direct-operation rejection, or a boundary error when a decorator's invocation protocol requires
throwing. No broad catch or absence/default fallback masks inspection exceptions. Noncanonical/proxy objects have
only the explicitly documented normalization guarantees.

Store presence separately from the value. Prepare a complete replacement snapshot before updating any entry:
validation or snapshot failure must not partially overwrite the old declaration. Custom values are trusted typed
inputs; this does not advertise general runtime validation of arbitrary JavaScript custom writes.

For accumulating collections, copy and shallow-freeze the outer array or dictionary on input and output.
Dictionary contributions use own enumerable string keys, not inherited properties or symbols. Use safe own-property
handling and null-prototype storage/results so keys such as `"__proto__"` and `"constructor"` are ordinary entries.
Collection values retain reference identity; nested mutation is outside the immutability promise. Ordinary
whole-object replacement values are neither cloned nor frozen by the library.

Compute inherited results when queried, without stale caches. Walk constructable class ancestors up to the end of the
class chain, preserving side/address separation. Deletion removes empty internal indexes where appropriate so
discovery cannot report stale metadata. Discovery deduplicates by actual identity and normalized address, not labels.

Install only `Reflect.metadata`, after domain state and predefined definitions exist. Inspect its descriptor before
changing it. Any occupied foreign handler causes `MetadataBoundaryError("foreign-handler")`, leaves that handler and
its descriptor unchanged, and aborts the import. An unavailable Reflect object or an unwritable/uninstallable free
slot produces the corresponding observable error. Successful installation leaves all other Reflect operations and
descriptors unchanged. Separate physical copies of the package are not coordinated implementations: their conflicting
activation fails explicitly; normal repeated imports of one evaluated ESM module share its handler and storage.

The predefined compiler constants need no subclass, specialized public method, or extra constructor option.
Compiler key/shape validation and emitted-array snapshots belong to the inbound adapter before it invokes the
ordinary value instance's `set`. Internal checked-write outcomes stay private; the Reflect callback translates a
rejection into the public boundary error because legacy compiler invocation has no result-outcome channel.

There is no supported uninstall, coexistence, background resource, startup/shutdown lifecycle, or cleanup API.
Tests of import failure and installation use fresh processes/browser realms, not a production reset hook or module
mocking. Test-owned process/browser resources have bounded startup, awaited completion and cleanup in `finally`,
with observable cleanup failures. No production logging is needed; typed outcomes and thrown errors expose failures
to callers without duplicating logs or disclosing input values.

## Validation

All runtime tests import the package-root API. Tests must not import implementation files, mock modules, inspect
private state, or export implementation helpers for coverage. Real compiler fixtures are test-owned inputs compiled
to library `tests/artifacts/`; the emitted artifact imports the public root before its decorated declarations run.

| Criterion | Verification method                                                                                                                                                                                                                                                                                                                            |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001    | Independent built-package Node and browser consumers resolve the root JS/declarations without DI or another Glacier package; verify export-map rejection of deep/subpath imports.                                                                                                                                                              |
| AC-002    | Real legacy fixtures and equivalent direct operations cover class, instance/static property/method/accessor, constructor and instance/static method parameters, including inaccessible-constructor cases.                                                                                                                                      |
| AC-003    | Matrix of unrelated classes, both sides, symbol/numeric names and parameter positions; object/instance annotation targets reject on mutations. Instance lookups share class declarations and do not create per-instance state; plain/prototype objects reject.                                                                                 |
| AC-004    | Same-name instances within/across all three classes remain distinct; deliberately shared instances read the same declarations and discovery returns that identity; predefined constants have stable shared identities.                                                                                                                         |
| AC-005    | Positive inference fixtures for each constructor and its scoped methods; expected compile failures for wrong value/element/entry writes and decorators, generic read misuse, definition widening and cross-class assignment.                                                                                                                   |
| AC-006    | Negative type fixtures for unknown keys, noncallable method-parameter addresses, fixed-tuple bounds, instance static/constructor-parameter addressing and address-driven target widening. Positive optional/empty/rest/symbol/numeric and explicit dynamic cases cover every checked/dynamic operation.                                        |
| AC-007    | Same-shaped replacement object and homogeneous accumulating record yield different approved inheritance results; no per-write mode switch exists.                                                                                                                                                                                              |
| AC-008    | Three-level nearest replacement, including object identity, compared with own-only reads and presence.                                                                                                                                                                                                                                         |
| AC-009    | Exact `["a", "b", "b", "c"]` inherited result and own-only `["b", "c"]`; no deduplication.                                                                                                                                                                                                                                                     |
| AC-010    | Whole conflicting entry replacement removes the ancestor's nested `label`; nonconflicting entries remain, including reserved dictionary keys.                                                                                                                                                                                                  |
| AC-011    | Independent homogeneous contributions; wrong entry type fails compilation; undeclared key has a possibly absent result type.                                                                                                                                                                                                                   |
| AC-012    | Matching constructor/method positions inherit without signature equivalence; own-only excludes ancestors, including differing descendant signatures.                                                                                                                                                                                           |
| AC-013    | Consecutive set/decorator writes retain only the latest direct value/list/record, while ancestors still contribute.                                                                                                                                                                                                                            |
| AC-014    | Discriminated missing/present-undefined reads, has/discovery presence, and undefined overriding a base replacement.                                                                                                                                                                                                                            |
| AC-015    | True/false direct delete results, unchanged ancestors/other locations, inherited reappearance and own-only absence.                                                                                                                                                                                                                            |
| AC-016    | Empty own lists/records remain present and retain base contributions; exported API/type review confirms no reset/suppression facility.                                                                                                                                                                                                         |
| AC-017    | Mutate original containers after set and decorator creation; attempt returned outer mutation; verify unchanged stored structure and contained/whole-object identity.                                                                                                                                                                           |
| AC-018    | Identity-set discovery across ancestry and own-only mode; no duplicates, including undefined/empty declarations and deletion cleanup.                                                                                                                                                                                                          |
| AC-019    | Definition-owned locations discovery without supplied names/positions; verify target-free plain addresses, constructor-wide/instance-filtered results, both lookup modes, deduplication, normalized names and subsequent readDynamic calls.                                                                                                    |
| AC-020    | Actual TypeScript emission records all three keys automatically in fresh Node/browser realms; explicit runtime import precedes fixture execution.                                                                                                                                                                                              |
| AC-021    | All three predefined constants are value-definition instances; descendant scalar/whole-array replacement includes empty arrays and own-only lookup. Compiler-ingested arrays are snapshotted/frozen; ordinary typed direct writes retain value identity.                                                                                       |
| AC-022    | Table of unknown keys, wrong scalar/array shapes, sparse arrays and invalid targets/addresses; compare old valid declaration before/after rejection; global decorator callback throws matching observable error.                                                                                                                               |
| AC-023    | Fresh realms with foreign handler/nonwritable slot; import fails and preserves handler/descriptor; successful import preserves unrelated Reflect descriptors and behavior.                                                                                                                                                                     |
| AC-024    | Review README/JSDoc/checked examples for explicit erasure, dynamic-location, overload, parameter inheritance, custom-JavaScript validation and runtime-representation limits.                                                                                                                                                                  |
| AC-025    | Execute constructor representation and explicit symbol annotation examples with an interface-typed dependency; verify no resolver/registry/DI token abstraction or signature-equivalence claim.                                                                                                                                                |
| AC-026    | Every runtime class/constructor/method, readonly nonconstructible discovery facade operation and predefined constant has named success, applicable rejection and boundary assertions; V8 enforces 100% statements, branches, functions and lines overall and per relevant production file; type-only exports have independent contract checks. |
| AC-027    | Compare constructor/instance read, has and discovery on base/subclass targets in both lookup modes; verify two instances share declarations, shadowed constructors do not redirect lookup, mutations require constructors, invalid plain/prototype targets reject and instance static/constructor-parameter addresses reject.                  |

Implemented library runtime contracts:

- [DefinitionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DefinitionContract.test.ts)
  and [AddressContract](../../../packages/libraries/glacier-reflection/tests/scenarios/AddressContract.test.ts):
  definition identity, presence, checked/dynamic addressing, isolation and atomic rejection.
- [InstanceLookupContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InstanceLookupContract.test.ts):
  constructor/instance aliases, shadowed constructors, category restrictions and exceptional inspections.
- [InheritanceContract](../../../packages/libraries/glacier-reflection/tests/scenarios/InheritanceContract.test.ts)
  and [CollectionOwnership](../../../packages/libraries/glacier-reflection/tests/scenarios/CollectionOwnership.test.ts):
  replacement/accumulation, deletion, no reset and shallow ownership.
- [LegacyDecoratorContract](../../../packages/libraries/glacier-reflection/tests/scenarios/LegacyDecoratorContract.test.ts)
  and [DecoratorMappedContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DecoratorMappedContract.test.ts):
  genuine emitted legacy locations and complementary source-mapped public callback contracts.
- [DiscoveryContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DiscoveryContract.test.ts):
  identity/location discovery, canonical frozen outputs and readonly detached facade operations.
- [CompilerMetadataContract](../../../packages/libraries/glacier-reflection/tests/scenarios/CompilerMetadataContract.test.ts)
  and [ImportCompatibility](../../../packages/libraries/glacier-reflection/tests/scenarios/ImportCompatibility.test.ts):
  genuine compiler recording, shape validation, atomic failures, exact exceptional causes and fresh import realms.
- [DistributionContract](../../../packages/libraries/glacier-reflection/tests/scenarios/DistributionContract.test.ts):
  independent generated-root ESM consumers, emission/import ordering, side-effect retention and subpath rejection.
- [PublicOperationMatrix](../../../packages/libraries/glacier-reflection/tests/scenarios/PublicOperationMatrix.test.ts):
  six definition objects × ten named operation cells, plus constructor/error/facade assertions.

Implemented independent type contracts:
[MetadataTypes](../../../packages/libraries/glacier-reflection/tests/contracts/MetadataTypes.test-d.ts),
[AddressTypes](../../../packages/libraries/glacier-reflection/tests/contracts/AddressTypes.test-d.ts),
[InstanceLookupTypes](../../../packages/libraries/glacier-reflection/tests/contracts/InstanceLookupTypes.test-d.ts),
[DecoratorTypes](../../../packages/libraries/glacier-reflection/tests/contracts/DecoratorTypes.test-d.ts), and
[DistributionTypes](../../../packages/libraries/glacier-reflection/tests/contracts/DistributionTypes.test-d.ts).
Checked adoption examples are
[AdoptionTypes](../../../packages/libraries/glacier-reflection/tests/data/examples/AdoptionTypes.ts) and
[AdoptionExample](../../../packages/libraries/glacier-reflection/tests/data/compiler/AdoptionExample.ts), executed by
the [native example owner](../../../packages/libraries/glacier-reflection/tests/data/AdoptionExampleRun.ts).
The [current criterion/evidence join](Tasks.md#t-019-attempt-3-current-evidence-join),
[complete local gate](Tasks.md#t-021---run-the-complete-local-automated-verification-gate), and
[manual ADR review](Tasks.md#t-022---review-all-adrs-contracts-and-assertion-quality)
own observed execution and fixed-revision results; these links do not replace separately required CI or human acceptance.

Use a dedicated type-check configuration including contracts and consumer examples. Pair positive assertions with
targeted `@ts-expect-error` negative cases, so an accepted misuse fails through an unused expected-error directive.
For the first declaration bootstrap of this approved story only, author these meaningful accepted-use and
rejected-misuse public-root fixtures before the production declarations they cover. Then add the exact approved
nonbehavioral declarations, build the root declarations, and independently verify intended inference/contracts and
negative diagnostics, including the unused `@ts-expect-error` guard. Record fixture-first/declaration-second order
and commands/results in Tasks.md; do not claim missing exports, setup failures or unrelated diagnostics as intended
type red, or introduce intentionally unsound signatures to manufacture it. This bounded exception does not authorize
runtime behavior before meaningful runtime red. Type behavior changes after the first bootstrap still require
meaningful type red/green/refactor against the established contracts; unchanged type contracts remain independently
verified, not required to fail artificially. Erased types are not runtime-covered.
Generic signatures need explicit tests for parameter optionality/rest lists,
overloaded methods, private/protected constructors, inherited keys and definition variance. For each constructible
definition class, check inferred read types and rejected value shapes; check that predefined constants expose exactly
the ordinary value-definition API and that their parameter array is not an accumulating list.
Run those checks through all checked method signatures, not a representative factory alone: `set`, `read`, `has`,
`delete` and `MetadataDiscovery.definitions` must retain target-related address guarantees. Explicit dynamic paths
must not accidentally widen checked calls. Type fixtures also verify checked instance lookup address restrictions,
constructor-only mutations and the shapes of discovered plain records. Runtime cases cover dynamic instance
address restrictions and constructors supplied through erased object references. Runtime invalid-input cases
must establish explicit rejection rather than metadata absence, and rejected writes must leave old values intact.

Run ordinary library Vitest Node tests and a browser-mode project whose runtime discovery remains restricted to
`tests/scenarios/**/*.test.ts` and `tests/scenarios/**/*.test.tsx`. Shared public behavior executes in both projects;
process-launch tests are Node-only. Build-first fixture preparation supplies genuine decorator emission rather than
depending on Vitest's transform to implement `emitDecoratorMetadata`. Browser cases run only in Chromium,
importing the same public root; distribution cases also exercise built ESM rather than only source transforms.

Collect V8 coverage in the Node and Chromium projects and combine mapped coverage before applying thresholds.
No Firefox/WebKit compatibility projects are required. Include every production implementation
and supporting file, even if unloaded; exclude only nonproduction tests/configuration/declaration artifacts, never
executable branches or ignore annotations. Fail on any overall or per-file metric below 100%.
Prove negative coverage controls and report assertion quality separately from percentages.

Extend existing commands rather than claim the current empty workspace already verifies a library:

- Add package `test` and coverage/type-contract preparation tasks, and a root `pnpm test` routed through Turbo.
  Include library coverage execution in root `pnpm check` alongside existing lint/format/type/build/catalog/tooling
  gates. Test inputs include fixtures, contracts, source, manifests, relevant configuration and lockfile.
- Before final review, run `pnpm check` and an explicit fresh `pnpm exec turbo run test --force`; the latter must
  execute the complete library runtime/coverage suite and browser matrix, not reuse evidence from a previous run.
- CI independently installs pinned dependencies/browser engines, runs the same complete gates, and retains root
  diagnostics plus `packages/libraries/glacier-reflection/tests/artifacts/` on success or failure.
- Applicable Snyk dependency checks must cover the updated workspace manifests/lockfile. Missing/stale/failing Snyk
  or browser/test configuration blocks acceptance. Container-image scans are inapplicable: no image is introduced.

Manual review covers all eight active ADRs, layer/relative-import boundaries, root export curation, JSDoc and checked
examples, meaningful assertions, error atomicity, explicit import effects, compiler and erasure limits, dependency
approval, and changed documentation links. Before accepting the current revision, integrate current main, renew
checks and obtain human acceptance; AI review is assistance, not acceptance.

The discovery shell reported Node 25.5.0, not the workspace-mandated Node 24.21.0.
Implementation verification must activate the declared runtime, not treat checks under that discovery shell as
supported-LTS evidence. Tasks.md owns observed execution and any unresolved harness blockers.

## E2E tests

Not applicable: this story introduces only a library and its public package-root API. It adds no application UI,
public service HTTP operation, application personas, or business acceptance-catalog criterion/scenario.
AC-001 through AC-027 remain story-local; no entries under workspace `tests/acceptance/` or Playwright specs under
workspace `tests/scenarios/` are proposed. Existing empty-catalog/tooling validation remains a workspace regression
gate. Browser execution through Vitest's Playwright provider is library-contract verification, not application E2E
testing, and does not require a Testcontainers application stack.

## Dependencies, risks, and open decisions

On 2026-10-04 the user approved native ESM/ES2023, Node 24 LTS, Chromium-only browser verification, no runtime dependencies,
and package-local development pins `vitest` 5.0.3, `@vitest/coverage-v8` 5.0.3,
`@vitest/browser-playwright` 5.0.3, and `playwright` 1.63.0. Report conflicts rather than silently substituting tools.

The user approved extending browser-provider and Playwright scope to non-React library testing; update the lasting
dependency notes before adding them. Vitest and its V8 coverage provider already have library-wide
scope. Reuse existing workspace TypeScript/Node tooling; any additional direct dependency requires separate explicit
approval. There is no requirement for `reflect-metadata`, a schema validator, React, Storybook, jsdom, a bundler
dependency, or a DI package.

| Risk/prerequisite                                                               | Mitigation and approval boundary                                                                                                                                                                |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| First library needs real test/coverage/CI wiring                                | P-002 supplies gates and negative controls before behavior; unavailable tooling does not count as a passing gate.                                                                               |
| No existing declarations can establish meaningful initial type red              | The dated ADR-0006 exception requires public-root type fixtures before exact approved declarations and intended post-declaration verification; runtime and later type-change red remain strict. |
| Compiler metadata is emitted only where TypeScript emits it                     | Real compiler fixtures include decorated declarations; do not promise metadata on every undecorated class/member.                                                                               |
| Inheritance can obscure changed parameter meaning                               | Document position-only inheritance and use own-only examples for DI foundations.                                                                                                                |
| Global activation conflicts or bundler removal                                  | Fail without replacing foreign handlers; declare side effects and document runtime import ordering and one-copy-per-realm operation.                                                            |
| Private signatures, overloads, index signatures and erased types limit checking | Separate checked and dynamic paths; test known guarantees and document where they stop.                                                                                                         |
| Embedded-address generics might infer a broader target to accept a typo         | Anchor inference to the target with NoInfer and test all checked signatures; use explicitly named dynamic operations for erased/discovered names.                                               |
| Structural instance types do not prove canonical runtime class identity         | Normalize prototype data descriptors without invoking getters; reject plain/prototype inputs, ignore shadowed constructor properties and document prototype-based identity limits.              |
| Instances are lookup aliases, not annotation targets                            | Preserve constructor-only writes/deletion and verify the brief's AC-027 boundaries.                                                                                                             |
| Definition generic variance could allow unsound writes                          | Use invariant generic declarations, distinct private brands and negative widening/cross-class assignment tests, not casts or broad generic read methods.                                        |
| Browser source transforms may not emit design metadata                          | Compile test-owned fixtures with TypeScript first and import real emitted artifacts in isolated realms.                                                                                         |
| Coverage merging/source maps can falsely exclude paths                          | Include all production files and require negative controls for omitted branches/unloaded files before acceptance.                                                                               |
| Foreign-handler tests cannot reuse an activated realm                           | Fresh child processes and browser realms; no reset/uninstall export, private-state inspection or module mocking.                                                                                |
| Snyk evidence and supported Node activation are environment-owned               | Secure owner integration/runtime setup; unavailable applicable checks block acceptance.                                                                                                         |

The user requested the embedded approach and instance read-side convenience on 2026-10-04. Their boundaries are
specified above and in Brief.md AC-027, not left to implementation. Joint approval is recorded below;
no per-instance annotation, static-instance lookup, individual constructor-parameter lookup through
instances, global class registry, or method-only inventory is proposed.
The complete API and its detailed error/typing semantics are included in joint approval.
If implementation discovers that a promised signature or gate is
infeasible, return to this plan's approval rather than weaken the brief or export unsafe conveniences.

## Migration and rollout

This is the first library; there is no existing package API or stored-data migration. Consumers import the root at
runtime before decorated modules execute, enable legacy `experimentalDecorators` and `emitDecoratorMetadata` when
compiler records are wanted, and deliberately share definition objects. Examples use supported ESM imports.
Use constructor targets for `set`/`delete`, constructors or supported instances for read-side operations, and plain
discriminated address records for members/parameters. The draft location-object design is superseded, not a legacy
API requiring a compatibility layer. Dynamic/discovered names use explicit dynamic operations.

Adoption deliberately excludes `reflect-metadata` coexistence and compatibility with consumers of its other global
operations. Check application dependency trees for foreign implementations and duplicate physical copies before
adoption; do not delete a foreign handler to make activation pass. Type-only imports are insufficient for recording.
Consumers do not infer interfaces, generics, parameter names, constructability or DI equivalence from emitted values.

Recovery from an activation failure is correcting the conflicting dependency/import arrangement and restarting the
affected process or browser realm. Removing an active implementation requires a fresh realm, not an uninstall call.
Metadata is transient and class-owned; there is no durable migration or rollback data.

Commit, PR publication, current-main review and confirmed merge follow ADR-0006 with their separate permissions.
Package publishing, release, deployment and execution of a consuming application are not story completion gates.

## Approval

On 2026-10-04, after T-021 attempt2 and T-022 attempt2 completed corrected-revision local verification and
manual review, the user explicitly selected **"Authorize closure preparation and story archival (Recommended)"**.
This authorizes only T-023: move this story's three notes to `.docs/Archive/glacier-reflection/`, update the
Stories/Archive indexes, repair directly affected relative references, link actual implemented tests and recheck
affected documentation/gates under sole Tasks ownership. It changes no design or Brief.md AC-001 through AC-027.
Archival is pre-merge review preparation, not delivery or human acceptance. It grants no staging, commit,
push, PR publication, remote scan/action, or merge permission; T-024 onward retain their separate gates.

On 2026-10-04, after T-013 attempt 2 demonstrated the inaccessible constructor's remaining coverage gap, the user
explicitly selected **"Approve a nonconstructible static facade design preserving MetadataDiscovery.definitions
calls and meaningful 100% coverage (Recommended)"**. This renews approval for the material discovery export-kind
revision specified in Public contract details: the readonly frozen nonconstructible operation record backed by
class-first domain behavior, with unchanged calls, generic NoInfer signatures, result types and discovery semantics.
It supersedes only the previous exported MetadataDiscovery class/private-constructor representation; no public
instance class-type, subclassing or prototype contract is retained. Brief.md AC-001 through AC-027 remain unchanged.
No dependency, runtime baseline, coverage policy, other API, or non-goal changes are approved. T-013 attempt 3
must establish the new readonly/frozen facade contracts test-first and renew independent types and mapped discovery
coverage. This is design/implementation approval, not worker completion, final acceptance or authorization to stage,
commit, push, publish, merge or archive.

**Approved on 2026-10-04.** The user explicitly selected "Approve aligned plan, criteria, dependencies, and
implementation" after prerequisite documentation alignment. Approval covers the complete public API and
failure/typing contracts, P-001 through P-008, Brief.md AC-001 through AC-027 and the stated non-goals and
constructor/instance/runtime bounds. The user separately approved npm identity `@glacier/reflection` and its
corresponding consumer-import/distribution updates, plus the exact development pins and scaffold integration
recorded above. The declared Node 24.21.0 will be used session-locally, without changing global Node.

On 2026-10-04 the user explicitly directed "Use only chromium for playwright tests", superseding the originally
approved three-engine matrix. This approves Chromium-only browser tests, installation and distribution verification;
Firefox/WebKit are excluded from required verification, not silently skipped. Node tests and combined Node/Chromium
100% coverage requirements remain unchanged. All other approved criteria and implementation scope remain unchanged.

On 2026-10-04, after the first T-009 attempt exposed the absent-declaration type-red conflict, the user explicitly
selected: "Approve a narrowly scoped type-bootstrap exception: author positive/negative type contracts before
declarations, verify them afterward, and retain meaningful runtime red gates". This approves the corresponding
bounded update to existing ADR-0006 and P-003/Validation: only the first declaration bootstrap of this approved
Glacier reflection API may use meaningful accepted-use/rejected-misuse public-root fixtures authored before
production declarations and verified afterward, with intended diagnostics/contracts and unused `@ts-expect-error`
guards. Fixture/declaration order must be retained as evidence; missing symbols/setup failures are not intended red,
and intentionally unsound production baselines are not authorized. Meaningful runtime red/green/refactor remains
unchanged; type behavior changes after bootstrap still require meaningful type red/green/refactor. This decision
changes no API signature, AC-001 through AC-027, dependency or other approved scope, and makes no runtime-coverage
claim for erased types. ADR-0005 already requires independent type verification rather than pre-declaration red and
does not need an exception. This approval is not completion evidence, human acceptance, or permission to stage,
commit, push, publish, merge or archive.

Earlier discovery: The user requested a plan including the full public API, confirmed reuse of the existing
`feature/glacier-reflection` branch while preserving Brief.md, selected definition-owned operations, selected the
runtime/testing/dependency approach, requested three constructible definition classes plus three predefined
compiler-metadata instances, and requested embedded addressing and instance read-side lookup on 2026-10-04.
Those bounded decisions do not constitute approval of this entire
document or of AC-001 through AC-027 jointly with its detailed design.

Any material requirements/design change invalidates affected approval until renewed.
Implementation approval does not authorize commits, push, PR publication, human acceptance or merge.

## Related notes

- [Brief](Brief.md)
- [Tasks](Tasks.md)
- [Story plan template](../../Templates/Story%20Plan.md)
- [Stories](../../Stories/Index.md)
- [Archive](../Index.md)
- [Architecture decisions](../../Architecture/Decisions/Index.md)
- [ADR-0001: Techstack](../../Architecture/Decisions/ADR-0001-Techstack.md)
- [ADR-0002: Package architecture](../../Architecture/Decisions/ADR-0002-Package-architecture.md)
- [ADR-0003: Code style](../../Architecture/Decisions/ADR-0003-Code-style.md)
- [ADR-0004: React conventions](../../Architecture/Decisions/ADR-0004-React-conventions.md)
- [ADR-0005: Testing strategy](../../Architecture/Decisions/ADR-0005-Testing-strategy.md)
- [ADR-0006: Workflow](../../Architecture/Decisions/ADR-0006-Workflow.md)
- [ADR-0007: Acceptance catalog](../../Architecture/Decisions/ADR-0007-Acceptance-catalog.md)
- [ADR-0008: Story documentation](../../Architecture/Decisions/ADR-0008-Story-documentation.md)
- [Workspace dependencies](../../Architecture/Dependencies/Workspace%20Dependencies.md)
- [Frontend dependencies](../../Architecture/Dependencies/Frontend%20Dependencies.md)
- [Library rules](../../Engineering/Code%20Style/Rules/Backend%20Library%20Rules.md)
- [CI](../../Engineering/CI/Overview.md)
- [Workspace compiler configuration](../../../tsconfig.base.json)
- [Workspace tasks](../../../turbo.json)
- [Quality workflow](../../../.github/workflows/quality.yml)
