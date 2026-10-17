# @glacier/schema

Private, native ESM class-based schema validation and transformation built on
[`@glacier/reflection`](../glacier-reflection/README.md). Decorated classes act as validator and
transformer in one pipeline. Phases 2-3 provide the core pipeline: primitive decorators with constraints, modifiers, per-call coercion,
`parse` / `safeParse` and typed errors. Collections, unions, refinements, composition and JSON Schema follow
in later phases.

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
- Types: `ISchemaIssue`, `ISchemaIssueCode`, `IResult`, `ISchemaDecoratorOptions`, `IEnumSource`, `ILiteralValue`, `IStringOptions`, `INumberOptions`, `IStringFormat`, `ISchemaParseOptions`, `ITransformFunction`.

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
