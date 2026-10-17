# @glacier/schema

Private, native ESM class-based schema validation and transformation built on
[`@glacier/reflection`](../glacier-reflection/README.md). Decorated classes act as validator and
transformer in one pipeline. Phases 2-7 provide the core pipeline: primitive decorators with constraints, modifiers, per-call coercion,
collections, nested objects, unions, `parse` / `safeParse` and typed errors and refinements. Composition (inheritance and mapped types) is included; JSON Schema follows
in a later phase.

## Public API

Only the package root is exported (`"."`); there are no subpaths or deep imports.

- `parse(Class, input, options?)` returns an instance or throws `SchemaError`; `safeParse(Class, input, options?)`
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
  `invalid_discriminator`. It works on a property (nested instance) or on a base class, where `parse(Base, input)`
  returns the selected variant instance (subclasses do not inherit the union, and a class cannot list itself).
  `IsOneOf([String, Number, Class])` tries the options in order without a discriminator; coercion is applied only
  when no option matches as given, and a mismatch is one `invalid_union` issue with each option's issues in
  `params.attempts`. Unions are not accepted as collection element types; wrap them in a class.
- `SchemaError` (`code = "SCHEMA_VALIDATION_FAILED"`, `issues`, `toJSON()`), `isSchemaError(error)` (a brand
  check that works across duplicate package copies) and `SchemaDefinitionError` for incorrectly declared classes.
- Modifiers (unprefixed, combinable with the type decorator in either order, inherited): `Optional` (missing or
  `undefined` allowed, key stays absent), `Nullable` (`null` allowed and kept), `Default(value | factory)`
  (replaces `undefined` only, never `null`; makes the input optional; the default is still transformed and
  validated), `Rename('inputKey')` (reads another input key; issue paths use it) and `Transform(fn)` (custom
  transform before validation; throwing yields a `transform_failed` issue).
- Coercion is off by default and enabled per call only: `parse(Class, input, { coerce: true })` converts
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
- Types: `IDerivedClass`, `IDerivedClassOptions`, `IRefineOptions`, `IIssueCode`, `ISchemaIssue`, `ISchemaIssueCode`, `IResult`, `ISchemaDecoratorOptions`, `IEnumSource`, `ILiteralValue`, `IStringOptions`, `INumberOptions`, `IStringFormat`, `ISchemaParseOptions`, `ITransformFunction`.

```ts
import "@glacier/reflection/register";
import { IsInt, IsString, parse } from "@glacier/schema";

class Signup {
  @IsString() public name!: string;
  @IsInt() public age!: number;
}

const signup = parse(Signup, { name: "Ada", age: 36, ignored: true }); // Signup { name, age }
```

Instances are created with `Object.create(prototype)`: the constructor and field initializers never run and
unknown keys are stripped. Declared fields are required unless `Optional` or `Default` applies. The first parse of a class compiles and caches its
schema and freezes the metadata of the class and its ancestors; decorating afterwards throws
`SchemaDefinitionError`. A primitive decorator that contradicts the emitted TypeScript type (for example
`@IsString()` on a `number` property) also throws; unions and interfaces emit `Object` and are not checked.

## Setup

Requires legacy decorators and compiler metadata, so consumers enable `experimentalDecorators` and
`emitDecoratorMetadata` and import `@glacier/reflection/register` first (this library never registers it itself).

## Scenarios

See [tests/scenarios/README.md](tests/scenarios/README.md).
