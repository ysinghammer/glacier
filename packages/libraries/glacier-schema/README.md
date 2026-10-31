# @glacier/schema

Private, native ESM class-based schema validation and transformation built on
[`@glacier/reflection`](../glacier-reflection/README.md). A decorated class is validator and transformer in one
pipeline (coerce, transform, validate, instance), with typed issues and JSON Schema / OpenAPI 3.1 output.

## Quick start

Enable `experimentalDecorators` and `emitDecoratorMetadata`, and import `@glacier/reflection/register` first
(this library never registers it itself).

```ts
import "@glacier/reflection/register";
import { IsInt, IsString, Schema } from "@glacier/schema";

class Signup {
  @IsString() public name!: string;
  @IsInt() public age!: number;
}

const signup = Schema.parse(Signup, { name: "Ada", age: 36, ignored: true }); // Signup { name, age }
```

Instances are created with `Object.create(prototype)`: the constructor and field initializers never run and
unknown keys are stripped. Declared fields are required unless `Optional` or `Default` applies. The first parse of a class compiles and caches its
schema and freezes the metadata of the class and its ancestors; decorating afterwards throws
`SchemaDefinitionError`. A primitive decorator that contradicts the emitted TypeScript type (for example
`@IsString()` on a `number` property) also throws; unions and interfaces emit `Object` and are not checked.

## Scenarios

See [tests/scenarios/README.md](tests/scenarios/README.md).

## JSON Schema

`Schema.toJsonSchema(Class, { target: "draft-2020-12" | "openapi-3.1" })` takes a single class. The result is a `$ref` to
the root definition plus `$defs` (`draft-2020-12`, with `$schema`) or `components.schemas` (`openapi-3.1`); nested
classes, unions and cycles are `$ref`s. Definition names are the class name or `@Describe({ name })`, and two
different classes with the same name throw `SchemaDefinitionError`. `Rename` aliases are the property names,
`Optional` and `Default` fields are not `required`, and `Nullable` adds `null` to the type. Discriminated unions are
`oneOf` plus `discriminator.mapping`; `IsOneOf` is `oneOf`. `@Describe({ title, description, example, deprecated })`
works on classes and properties (`example` becomes `examples`), and `@JsonSchema({...})` merges a fragment over the
generated keywords. `Refine` and `Transform` are skipped; regular expression flags other than none and `u` are not
expressible and are ignored; maps are emitted like records and bigint as integer. OpenAPI 3.0 is not supported.

## Preparation and outbound JSON

`Schema.prepare(Dto)` synchronously validates and warms cached input/output processing for the root,
ancestors and all reachable DTO references (including recursive unions and collections). It does not
construct DTOs or call default factories, transforms, refinements, getters or `toJSON`. Lazy class-reference
thunks are metadata resolvers and necessarily run to discover reachable definitions. Preparation is
idempotent and freezes reachable metadata; unrelated classes remain decoratable. Malformed definitions
throw `SchemaDefinitionError`. Failed preparation does not roll back freezing: correct the declarations
and use fresh classes/processes, rather than attempting a registry reset.

```ts
import { IsString, Rename, Schema } from "@glacier/schema";

/** Application response contract; constructors are never invoked by schema processing. */
class UserDto {
  @IsString()
  @Rename("display_name")
  public name!: string;
}

Schema.prepare(UserDto);
const result = Schema.safeSerialize(UserDto, { name: "Ada", internalNote: "discarded" });
if (result.ok) {
  const bytes = JSON.stringify(result.value); // {"display_name":"Ada"}
}
```

`safeSerialize` accepts unknown logical DTO data and returns `IResult<IJsonValue>`, not a DTO instance.
`IJsonValue` and `IJsonObject` are recursive readonly JSON contracts; runtime checks establish finite
numbers and descriptor safety. The detached result is not a claim that the source is frozen. Always
perform actual JSON serialization before writing transport bytes.

Output reads declared **logical** names, validates them, strips extras without inspecting their getters,
and emits `Rename` wire names recursively. `Optional` omissions stay absent and `Nullable` null stays null.
Default-only fields remain required: output never applies defaults, coercion, transforms, trim or lowercase.
Field refinements precede class refinements; field failure prevents class checks. Class checks receive
validated DTO-prototype-shaped data, so public methods can read logical fields, but constructor effects,
field initializers and private brands do not exist. Refinements must be observational checks, not mutate
the validated data; final projection still rejects unsafe/non-JSON mutations, without rerunning callbacks.

Nested DTOs, records and string-key Maps become objects; arrays, tuples and Sets become arrays; valid Dates
become ISO strings using intrinsic methods. Non-string Map keys, bigint, nonfinite numbers, functions,
symbols, unsupported instances, unsafe inspected accessors and cycles fail. Shared references without
cycles can be copied independently. `IsAny` on output accepts only recursively JSON-safe plain data, not
Dates/Maps/Sets or arbitrary `toJSON` encoders. Output recursion is bounded to 64 active objects, including
collection containers; this is separate from input's configurable class-level `maxDepth`.
Built-in safety codes are `unsafe_accessor`, `invalid_json_value`, `cyclic_value` and existing validation
codes. Property paths are logical names on output. Schema diagnostic messages and `params` can contain
private callback detail or values: HTTP adapters must expose only permitted location/path/code fields,
not raw issues or `SchemaError.toJSON()`. No HTTP/status handling is provided here.

### Direction and representational limits

`Schema.toJsonSchema(Dto, { target: "openapi-3.1", direction: "output" })` propagates direction through
all references, emits wire names, closed projected DTO objects, output requiredness, collection wire
forms and Date strings. Bigint and nonfinite literals have an unsatisfiable output schema (`not: {}`).
Nonfinite enum members are removed from output alternatives (an empty safe enum is unsatisfiable).
Map `propertyNames` describes the key constraints, intersected with JSON's string-key rule: a numeric-key
Map can only serialize when empty. Omitted direction and explicit `"input"` preserve existing generation
exactly. Generation remains pure, does not prepare/freeze, and retains existing per-call component names.

Documents are descriptions, not proof of full runtime/wire equivalence or external meta-schema validation:

- Strict input Dates require actual Dates when coercion is disabled, although documents describe strings.
- Arbitrary transforms/refinements and safe descriptor/finite-number checks are not fully representable.
- Runtime `IsOneOf` accepts the first match; overlapping JSON Schema `oneOf` alternatives require exactly
  one match, so their semantics can differ. Set uniqueness and object identity can also differ on the wire.
- `JsonSchema` overrides take precedence and can contradict validation or contain non-JSON keyword values.
  `IJsonSchema` therefore remains unknown-valued, not interchangeable with `IJsonValue`.
- Discriminator configuration must agree with declared variant wire fields; generation does not prove that
  every variant declares or preserves a discriminating literal. Consumers must check such contradictions.
- JavaScript proxies and globally replaced intrinsics are not a sandboxed execution contract. Ordinary
  data accessors and consumer collection/Date overrides are not invoked; arbitrary proxy traps cannot be
  detected portably before reflective operations.
- Component collisions are detected within one reachable graph only. Separate calls retain no class
  provenance; identical schema bytes do not prove class identity for whole-document OpenAPI assembly.

### Metadata-only wire compatibility

```ts
import { IsString, Schema } from "@glacier/schema";

/** Boundary validator whose metadata can be checked without constructing values. */
class WireDto {
  @IsString() public value!: string;
}

Schema.assertJsonSchemaCompatibility(WireDto, {
  direction: "input",
  wire: "json",
  coerce: false,
});
```

`assertJsonSchemaCompatibility(Dto, { direction, wire, coerce }): void` uses the readonly root
`IJsonSchemaCompatibilityOptions` contract and is an explicit opt-in
metadata-only check. `wire` is `json` or `text`; `coerce` is required. Output supports JSON without
coercion, matching `safeSerialize`. It reads all reachable/inherited field and union metadata,
resolves lazy references and checks recursive definitions after their components are complete.
It never constructs DTOs, invokes default/transform/refinement callbacks, freezes metadata or
changes existing parse/serialize/generation behavior. Malformed definitions or known contradictions
throw `SchemaDefinitionError`; there is no public registry/owner/field metadata exposure.

Known checks reject non-wire Map/Set inputs, strict Date/bigint input, unfaithful bigint/nonfinite
literal/enum representations and uncoerced non-string text scalars. Union discriminators must retain
a declared singleton wire value; missing, renamed, broad or mismatched variant fields fail. Structural
`JsonSchema` keywords must match the generated validation/projection structure. Descriptive annotations
(`title`, `description`, examples, deprecated, comments, read/write annotations and `x-` extensions)
are allowed, including nested schema descriptions; literal objects and property names are never
mistaken for annotation keywords. Unsafe/cyclic/non-JSON manual fragments fail without getter calls.

The check is deliberately conservative about structural overrides and does not infer invariants
from arbitrary refinements/transforms. Passing does not prove callback equivalence, overlapping
union equivalence, full wire serialization support, descriptor/identity guarantees, or external
JSON Schema/OpenAPI meta-schema validation. A transport adapter must additionally check its own
grammar (for example nested query arrays and scalar-only header fields). HTTP uses this public
operation without changing schema ownership or making schema depend on HTTP.

See [runtime compatibility scenarios](tests/scenarios/json-schema/SchemaCompatibility.test.ts) and
[public type contracts](tests/contracts/SchemaCompatibility.test-d.ts).

### Singleton query arrays

`Schema.safeParse(QueryDto, query, { coerce: true, coerceSingletonArrays: true })` explicitly promotes
present scalar values to `IsArray` arrays, then optionally coerces their elements. Promotion is independent
of scalar coercion, applies through nested DTOs, and never wraps objects, missing/null values, Sets or tuples.
Existing arrays remain arrays. Repeated query arrays bound to scalar fields still fail. Both options are
per-call; normal body parsing retains its old behavior unless explicitly opted in.

## Decorator reference

### Public API

Only the package root is exported (`"."`); there are no subpaths or deep imports.

- `Schema.parse(Class, input, options?)` returns an instance or throws `SchemaError`; `Schema.safeParse(Class, input, options?)`
  returns `IResult<T>` (`{ ok: true, value } | { ok: false, issues }`).
- Decorators: `IsString`, `IsNumber`, `IsInt`, `IsBoolean`, `IsBigInt`, `IsDate`, `IsLiteral`, `IsEnum`, `IsAny`.
  Each takes `{ message }` to override the English message of that field's issues.
- Constraints are decorator options. `IsString`: `min`, `max`, `length` (UTF-16 code units), `pattern`
  (RegExp), `format` (`email`, `uuid`, `url`, `date-time`, `date`, `ipv4`), `trim`, `lowercase` (applied before
  the checks). `IsNumber` / `IsInt`: `min`, `max`, `exclusiveMin`, `exclusiveMax`, `multipleOf`. The type is
  checked first, then the first violated constraint is reported per field (`too_small`, `too_big`,
  `invalid_format`, `not_multiple_of`). Impossible options throw `SchemaDefinitionError` when decorating.
- Collections and nesting: `IsArray(element, opts?)`, `IsSet`, `IsTuple([elements])`, `IsMap(key, value)`,
  `IsRecord(value)` and `IsObject(Class?)`. An element type is `String`, `Number`, `Boolean`, `BigInt`, `Date`, a
  decorated class, or `() => Class` for forward references and cycles. `IsArray`/`IsSet` take `min`, `max`, `unique`;
  `IsMap`/`IsRecord` take `min`, `max`. Issue paths run through the nesting (`["items", 2, "name"]`). Nesting is
  capped at 64 classes (`maxDepth` option) and reported as `max_depth_exceeded`.
- Unions: `IsUnion({ discriminator, variants: { value: Class | () => Class } })` selects the variant class by the
  discriminator before validating, so issues point into the variant; an unknown or missing discriminator is
  `invalid_discriminator`. It works on a property (nested instance) or on a base class, where `Schema.parse(Base, input)`
  returns the selected variant instance (subclasses do not inherit the union, and a class cannot list itself).
  `IsOneOf([String, Number, Class])` tries the options in order without a discriminator; coercion is applied only
  when no option matches as given, and a mismatch is one `invalid_union` issue with each option's issues in
  `params.attempts`. Unions are not accepted as collection element types; wrap them in a class.
- `SchemaError` (`code = "SCHEMA_VALIDATION_FAILED"`, `issues`, `toJSON()`), `Schema.isError(error)` (a brand
  check that works across duplicate package copies) and `SchemaDefinitionError` for incorrectly declared classes.
- Modifiers (unprefixed, combinable with the type decorator in either order, inherited): `Optional` (missing or
  `undefined` allowed, key stays absent), `Nullable` (`null` allowed and kept), `Default(value | factory)`
  (replaces `undefined` only, never `null`; makes the input optional; the default is still transformed and
  validated), `Rename('inputKey')` (reads another input key; issue paths use it) and `Transform(fn)` (custom
  transform before validation; throwing yields a `transform_failed` issue).
- Coercion is off by default and enabled per call only: `Schema.parse(Class, input, { coerce: true })` converts
  numeric strings, `"true"`/`"false"`, integer strings to bigint, ISO 8601 strings and timestamps to dates and
  primitives to strings, before validation. Values that cannot be converted are left for validation to reject.
  There is no field-level or class-level switch.
- `Refine` (sync only): on a property, `Refine((value) => boolean, message?)` runs last on the validated value
  (not for absent or `null` values) and reports `custom` at the field path; one per property. On a class,
  `Refine<T>((instance) => boolean, { path?, code?, message? })` runs on the instance only after every field
  validated, so it never runs when a field failed; `path` uses input keys (`Rename` aliases) and defaults to
  the root, `code` to `custom`. A class may have several (all run); subclasses inherit them. Exceptions are
  rejections with `params.reason`.
- Composition: subclasses inherit fields, modifiers and class refinements; a subclass type declaration replaces the
  inherited field including its modifiers, while a modifier-only entry adds to it. `PartialType(Class)` makes every
  field optional (dropping `Default`, so updates never inject values, and class refinements), `PickType(Class, keys)`
  and `OmitType(Class, keys)` select fields (class refinements dropped, unknown keys throw) and
  `ExtendType(Base, Extension)` merges the fields, extension fields replacing base fields, keeping both classes'
  refinements. Each takes `{ name }` (default `Partial<Source>`, `Pick<Source>`, `Omit<Source>`, `Extend<Base>`).
  The result is a new decorated class, not a subclass of the source, without methods; it can be parsed,
  extended with `extends` and derived again. Sources are frozen when derived from. Unions cannot be a source.
- Types (interfaces carry the `I` prefix required by the repository naming policy, so `IResult` and `ISchemaIssue` stand for the design's `Result` and `SchemaIssue`): `ICollectionOptions`, `ISizeOptions`, `IElementType`, `IUnionOptions`, `IUnionVariants`, `IJsonValue`, `IJsonObject`, `IJsonSchemaDirection`, `IJsonSchema`, `IJsonSchemaFragment`, `IJsonSchemaOptions`, `IJsonSchemaTarget`, `IDescribeOptions`, `IDerivedClass`, `IDerivedClassOptions`, `IRefineOptions`, `IIssueCode`, `ISchemaIssue`, `ISchemaIssueCode`, `IResult`, `ISchemaDecoratorOptions`, `IEnumSource`, `ILiteralValue`, `IStringOptions`, `INumberOptions`, `IStringFormat`, `ISchemaParseOptions`, `ITransformFunction`.

## Migrating from class-validator / class-transformer

| class-validator / class-transformer                   | `@glacier/schema`                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `validate(plainToInstance(C, input))`                 | `Schema.parse(C, input)` or `Schema.safeParse(C, input)`; one step, one result |
| `@IsEmail()`, `@IsUUID()`, `@IsUrl()`                 | `@IsString({ format: "email" \| "uuid" \| "url" })`                            |
| `@Min`, `@Max`, `@Length`, `@Matches`                 | Decorator options `min`, `max`, `length`, `pattern`                            |
| `@IsOptional()`                                       | `@Optional()`; never inferred from the TypeScript type                         |
| `@ValidateNested()` + `@Type(() => C)`                | `@IsObject(C)` / `@IsArray(C)`; no `@Type` needed                              |
| `@Transform(fn)`                                      | `@Transform(fn)` (runs before validation)                                      |
| `@Expose({ name })`                                   | `@Rename("inputKey")`                                                          |
| `@IsIn([...])`, `@Equals(x)`                          | `@IsEnum(...)`, `@IsLiteral(x)`                                                |
| `@ValidateIf`, custom validators                      | `@Refine` on a property or the class (sync only)                               |
| `enableImplicitConversion`                            | `Schema.parse(C, input, { coerce: true })`, per call only                      |
| `whitelist: true`                                     | Always on: unknown keys are stripped                                           |
| `PartialType` and friends from `@nestjs/mapped-types` | `PartialType`, `PickType`, `OmitType`, `ExtendType`                            |
| `ValidationError[]` tree                              | Flat `ISchemaIssue[]` with `path`, stable `code`, `message`, `params`          |

Behaviour differences: the constructor and field initializers never run (use `@Default`); there is no
`instanceToPlain`, expose/exclude groups, async validation, i18n or standard TC39 decorator support; the top-level
target is always a class (map arrays and primitives yourself).

## Adapter guidance

This package has no HTTP concepts. An adapter (HTTP, queue, CLI) catches failures with `Schema.isError` and maps
them itself; `Schema.isError` is a brand check, so it also works when two copies of the package are installed.

```ts
try {
  const dto = Schema.parse(Signup, body);
} catch (error) {
  if (Schema.isError(error)) {
    return {
      status: 400,
      body: { issues: error.issues.map(({ path, code }) => ({ path, code })) },
    };
  }
  throw error;
}
```

Alternatively use `Schema.safeParse` and branch on `result.ok`. Branch on the stable `code`, never on `message`.
`SchemaDefinitionError` signals a programming error in a class declaration and should not be mapped to a client
error.

## Scenarios

See [tests/scenarios/README.md](tests/scenarios/README.md).

## JSON Schema

`Schema.toJsonSchema(Class, { target: "draft-2020-12" | "openapi-3.1" })` takes a single class. The result is a `$ref` to
the root definition plus `$defs` (`draft-2020-12`, with `$schema`) or `components.schemas` (`openapi-3.1`); nested
classes, unions and cycles are `$ref`s. Definition names are the class name or `@Describe({ name })`, and two
different classes with the same name throw `SchemaDefinitionError`. `Rename` aliases are the property names,
`Optional` and `Default` fields are not `required`, and `Nullable` adds `null` to the type. Discriminated unions are
`oneOf` plus `discriminator.mapping`; `IsOneOf` is `oneOf`. `@Describe({ title, description, example, deprecated })`
works on classes and properties (`example` becomes `examples`), and `@JsonSchema({...})` merges a fragment over the
generated keywords. `Refine` and `Transform` are skipped; regular expression flags other than none and `u` are not
expressible and are ignored; maps are emitted like records and bigint as integer. OpenAPI 3.0 is not supported.
