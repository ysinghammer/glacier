# @glacier/schema

`glacier-schema` is a small, opinionated, object-oriented JSON Schema validator for TypeScript. It implements a **curated, pragmatic subset** of the [JSON Schema 2020-12](https://json-schema.org/draft/2020-12/release-notes) specification, and — unlike most validators — **fully infers static TypeScript types directly from your schema literal**. There is no code generation step, no separate type file to maintain, and no manual generic annotations for the common case.

It deliberately does **not** implement the full spec. Branching/negation keywords (`if`/`then`/`else`, `not`) and multi-schema boolean combinators other than `oneOf` (`allOf`, `anyOf`) are left out on purpose — see [Design philosophy](#design-philosophy) for why. If you need 100% spec fidelity, use [Ajv](https://ajv.js.org/) instead.

## Table of contents

- [Design philosophy](#design-philosophy)
- [Source layout](#source-layout)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Core concepts](#core-concepts)
  - [The `Schema` class](#the-schema-class)
  - [Type inference](#type-inference)
  - [Validating data](#validating-data)
  - [Errors](#errors)
  - [Assertion-style validation with `Schema.assertValid`](#assertion-style-validation-with-schemaassertvalid)
- [Supported keywords](#supported-keywords)
  - [`type`](#type)
  - [String keywords](#string-keywords)
  - [Numeric keywords](#numeric-keywords)
  - [`enum` and `const`](#enum-and-const)
  - [Object keywords](#object-keywords)
  - [Array keywords](#array-keywords)
  - [`oneOf`](#oneof)
  - [Metadata keywords](#metadata-keywords)
- [Composition](#composition)
  - [Reusing schemas across files](#reusing-schemas-across-files)
  - [Recursive schemas](#recursive-schemas)
- [Explicitly unsupported keywords](#explicitly-unsupported-keywords)
- [The `null` type is not supported](#the-null-type-is-not-supported)
- [API reference](#api-reference)
- [Implementation plan](#implementation-plan)

## Design philosophy

- **Reasonable subset, not full compliance.** JSON Schema's full spec includes keywords that add significant conditional-branching complexity (`if`/`then`/`else`, `not`, `allOf`, `anyOf`, `unevaluatedProperties`, `$dynamicRef`) for relatively rare use cases. `glacier-schema` leaves these out to keep the validator, and the type-inference engine behind it, simple and predictable.
- **Unsupported constructs are compile-time errors, not silent no-ops.** Using an unsupported keyword or keyword combination (see [Explicitly unsupported keywords](#explicitly-unsupported-keywords)) is a TypeScript type error on the schema literal itself. As defense-in-depth against bypassing the type system (e.g. via `as any`, or a schema literal built from untyped/external data), the compiler also throws at `Schema` construction time if it encounters one of these at runtime.
- **TypeScript-first.** Schemas are plain JSON-Schema-shaped object literals, but authored with `as const` so the library can derive an exact static type from them — no separate `.d.ts`, no manual generics, no drift between runtime validation and compile-time types.
- **Internal composition, not JSON interop.** `glacier-schema` schemas are not designed to be serialized out to other JSON-Schema tooling. Reuse across files happens through ordinary TypeScript `import`/`export`, and recursive schemas use a lazy-thunk builder — not `$ref`/`$defs`.
- **No `null`.** JSON's `null` is unsupported everywhere in this library (see [below](#the-null-type-is-not-supported)).

## Source layout

The package separates stable concepts from implementation details using names
that apply to other libraries as well:

```text
src/
  definition/                 # Input grammar, metadata, and type inference
    _interfaces/              # Definition object shapes
  schema/                     # Public Schema behavior and construction
    _constants/
    _functions/
    _interfaces/
  validation/                 # Validation outcomes and runtime behavior
    _exceptions/
    _interfaces/
    compiler/                 # Internal conversion of definitions to validators
      _functions/
      _interfaces/
    formats/                  # Built-in format validation rules
      _functions/
```

This layout is reusable for packages that have a public API, an input or
domain model, and runtime processing: replace `schema` with the package's
primary concept and retain `definition` and `validation` only when those
responsibilities exist. Classes remain directly in their responsibility
folder; interfaces, functions, constants, and exceptions use the shared
underscore-prefixed grouping folders.

## Installation

```bash
npm install @glacier/schema
```

## Quick start

```ts
import { Schema } from '@glacier/schema';

const userSchema = new Schema({
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', minLength: 1 },
    age: { type: 'integer', minimum: 0 },
    role: { type: 'string', enum: ['admin', 'member'] }
  },
  required: ['id', 'name', 'role']
} as const);

// `User` is inferred automatically — no manual typing needed.
type User = Infer<typeof userSchema>;
// { id: string; name: string; age?: number; role: "admin" | "member" }

const result = userSchema.validate(payload);

if (result.valid) {
  // result.data is typed as `User`
  console.log(result.data.name);
} else {
  // result.errors is a typed ValidationError[]
  console.error(result.errors);
}
```

## Core concepts

### The `Schema` class

Every schema is an instance of `Schema`, constructed from a plain object that follows JSON Schema syntax:

```ts
const schema = new Schema({ type: 'string', minLength: 3 } as const);
```

The `as const` assertion is required — it's what lets TypeScript treat the object as an exact literal type instead of widening `"string"` to `string`, which is what the type-inference engine reads to derive your static type.

Constructing a `Schema` **compiles it immediately**: the schema tree is walked once, up front, and turned into a tree of composed validator functions. There is no separate `.compile()` step, and no `eval`/`new Function` codegen — validation is a plain interpreter walking pre-built closures, which keeps it debuggable and safe to run in restrictive environments (e.g. strict CSP).

### Type inference

`glacier-schema` maps schema keywords to TypeScript types automatically:

| Schema                                                              | Inferred type                                                                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{ type: "string" }`                                                | `string`                                                                                                                                                                  |
| `{ type: "string", enum: ["a", "b"] }`                              | `"a" \| "b"`                                                                                                                                                              |
| `{ type: "integer" }` / `{ type: "number" }`                        | `number`                                                                                                                                                                  |
| `{ type: "boolean" }`                                               | `boolean`                                                                                                                                                                 |
| `{ type: "object", properties: {...}, required: [...] }`            | interface, with properties absent from `required` marked optional (`?:`); `additionalProperties` defaults to `false` when omitted, so the type is exact/closed by default |
| `{ type: "object", additionalProperties: {...} }` (no `properties`) | index signature, e.g. `{ [key: string]: T }`                                                                                                                              |
| `{ type: "array", items: {...} }`                                   | `T[]`                                                                                                                                                                     |
| `{ type: "array", prefixItems: [...] }`                             | tuple type, e.g. `[string, number]`                                                                                                                                       |
| `{ oneOf: [...] }`                                                  | union of each branch's inferred type                                                                                                                                      |

Note: `type` and `oneOf` are mutually exclusive on the same schema node — combining them would implicitly reintroduce `allOf`-style composition, which this library deliberately does not support. Similarly, `properties` and a schema-valued (or `true`) `additionalProperties` are mutually exclusive on the same node (see [Object keywords](#object-keywords)) — this keeps the object-type inference to a single, always-safe strategy instead of needing to reconcile an index signature against explicit property types.

Use the exported `Infer<S>` utility to extract a schema's type anywhere, without needing a validation result in hand:

```ts
import { Schema, type Infer } from '@glacier/schema';

const pointSchema = new Schema({
  type: 'object',
  properties: { x: { type: 'number' }, y: { type: 'number' } },
  required: ['x', 'y']
} as const);

type Point = Infer<typeof pointSchema>; // { x: number; y: number }

function draw(point: Point) {
  /* ... */
}
```

### Validating data

```ts
const result = schema.validate(data);
```

`.validate()` never throws. It always returns a discriminated union:

```ts
type ValidationResult<T> = { valid: true; data: T } | { valid: false; errors: ValidationError[] };
```

Narrow on `result.valid` to get a fully-typed `result.data` (or `result.errors`).

There is intentionally **no instance-level throwing `.parse()`/`.assert()` variant** — `.validate()` always returns a result you handle explicitly. For call sites that prefer to fail fast instead, see [`Schema.assertValid`](#assertion-style-validation-with-schemaassertvalid) below.

### Errors

By default, `.validate()` collects **every** validation error in the document, not just the first one. Each error has the shape:

```ts
interface ValidationError {
  /** Location of the failing value, as path segments (not a JSON Pointer string). */
  path: (string | number)[];
  /** The schema keyword that failed, e.g. "minimum", "required", "pattern". */
  keyword: string;
  /** Human-readable description of the failure. */
  message: string;
  /** Keyword-specific structured details, e.g. `{ limit: 18 }` for a failed `minimum`. */
  params: Record<string, unknown>;
}
```

`path` is an array of segments (property names / array indices) rather than a JSON-Pointer string, so you can consume it programmatically without string parsing. Example:

```ts
{
  path: ["address", "zip"],
  keyword: "pattern",
  message: "must match pattern \"^[0-9]{5}$\"",
  params: { pattern: "^[0-9]{5}$" },
}
```

### Assertion-style validation with `Schema.assertValid`

For call sites that would rather fail fast than handle a `ValidationResult`, `Schema.assertValid` is a static [TypeScript assertion function](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#assertion-functions) — it validates a value against a schema and, on success, narrows `value`'s type in place; on failure, it throws a `SchemaValidationError` instead of returning a result:

```ts
import { Schema } from '@glacier/schema';

const userSchema = new Schema({
  type: 'object',
  properties: { name: { type: 'string' } },
  required: ['name']
} as const);

function greet(input: unknown) {
  Schema.assertValid(userSchema, input);
  // TypeScript now knows `input` is `Infer<typeof userSchema>` beyond this line.
  console.log(`Hello, ${input.name}`);
}
```

If validation fails, `Schema.assertValid` throws a `SchemaValidationError` carrying everything needed to diagnose the failure:

```ts
class SchemaValidationError extends Error {
  /** The schema definition the value was checked against. */
  readonly schema: unknown;
  /** The actual value that failed validation. */
  readonly value: unknown;
  /** Every collected validation error, same shape as `ValidationResult`'s `errors`. */
  readonly errors: ValidationError[];
}
```

```ts
try {
  Schema.assertValid(userSchema, input);
} catch (err) {
  if (Schema.isValidationError(err)) {
    console.error(err.schema, err.value, err.errors);
  }
}
```

`Schema.assertValid` is a thin convenience wrapper around `.validate()` — it does not change collect-all-errors behavior; on failure, `err.errors` still contains every error found, not just the first.

`Schema.isValidationError` is a static type guard for exactly this `catch` pattern, mirroring [Axios's `isAxiosError`](https://axios-http.com/docs/handling_errors): `Schema.isValidationError(err): err is SchemaValidationError`. Prefer it over `err instanceof SchemaValidationError` — it's more robust when multiple copies of the package end up in the dependency tree (a common source of `instanceof` false negatives), since it's not required to check the prototype chain and can instead check a stable internal marker.

## Supported keywords

### `type`

A single primitive type name. Arrays of types (e.g. `["string", "null"]`) are **not** supported — see [`null`](#the-null-type-is-not-supported).

Supported values: `"string"`, `"number"`, `"integer"`, `"boolean"`, `"object"`, `"array"`.

### String keywords

- `minLength`, `maxLength`
- `pattern` (regular expression, tested against the string value)
- `format` — enforced (not annotation-only) for a curated subset, and the TypeScript type of `format` is restricted to exactly this literal union — passing any other string is a compile-time error, not a silent no-op:
  `"email"`, `"date-time"`, `"date"`, `"time"`, `"uuid"`, `"uri"`, `"ipv4"`, `"ipv6"`

### Numeric keywords

Apply to `"number"` and `"integer"`:

- `minimum`, `maximum`
- `exclusiveMinimum`, `exclusiveMaximum`
- `multipleOf`

### `enum` and `const`

- `enum`: value must equal one of the listed values; inferred as a union of literal types.
- `const`: value must equal exactly the given value; inferred as that literal type.

### Object keywords

- `properties` — maps property names to sub-schemas.
- `required` — array of property names; properties not listed are optional (`?:`) in the inferred type.
- `additionalProperties` — constrains properties not covered by `properties`. Mutually exclusive with `properties` unless it is exactly `false`:
  - `properties` + `additionalProperties: false` (or omitted, which **defaults to `false`**) — a closed/exact object type; only the listed properties are allowed.
  - `additionalProperties: <schema>` or `additionalProperties: true` **without** `properties` — an open object typed as an index signature (`{ [key: string]: T }`, or untyped extras for `true`).
  - `properties` combined with a schema-valued or `true` `additionalProperties` is a **compile-time error** — see [Type inference](#type-inference) for why.
- `propertyNames` — a string schema applied to every property key itself. Independent of `additionalProperties`/`properties`, so it composes freely with either.

`patternProperties` is **not supported** — see [Explicitly unsupported keywords](#explicitly-unsupported-keywords).

### Array keywords

- `items` — schema applied to every array element (or to elements past the end of `prefixItems`, if both are present).
- `prefixItems` — an array of schemas, validated positionally, for tuple-shaped arrays.
- `contains`, `minContains`, `maxContains` — require that some number of elements match a given schema.
- `uniqueItems` — require all elements to be distinct.

### `oneOf`

An array of schemas where **exactly one** must match. If zero or more than one branch matches, validation fails with a `oneOf` error. The inferred type is the union of each branch's inferred type.

`oneOf` is mutually exclusive with `type` on the same schema node — combining them would implicitly reintroduce `allOf`-style composition, which this library deliberately does not support (see below).

`allOf` and `anyOf` are **not** supported (see [below](#explicitly-unsupported-keywords)) — model unions with `oneOf` instead.

### Metadata keywords

`title`, `description`, `default`, `examples`, `deprecated`, `readOnly`, `writeOnly` are accepted and stored on the compiled `Schema` instance (e.g. `schema.meta.description`) for introspection, but have **no effect on validation or type inference**. There is currently no doc-generation tooling built on top of them.

## Composition

### Reusing schemas across files

Because `glacier-schema` has no `$ref`/`$defs`, schema reuse across files is just ordinary TypeScript module composition. Export a `Schema` instance, import it elsewhere, and embed it directly as a nested value:

```ts
// address.ts
export const addressSchema = new Schema({
  type: 'object',
  properties: {
    street: { type: 'string' },
    zip: { type: 'string', pattern: '^[0-9]{5}$' }
  },
  required: ['street', 'zip']
} as const);
```

```ts
// user.ts
import { addressSchema } from './address';

const userSchema = new Schema({
  type: 'object',
  properties: {
    name: { type: 'string' },
    address: addressSchema
  },
  required: ['name', 'address']
} as const);
```

The parent schema's compiled validator calls the embedded schema's already-compiled validator as a sub-check, and its inferred type is spliced into the parent's inferred type automatically.

### Recursive schemas

A schema can't be embedded inside itself as a plain object literal — the literal would have to contain itself. Self-referential structures (trees, linked lists, nested comments, etc.) use a lazy-thunk builder instead:

```ts
interface TreeNode {
  value: number;
  children: TreeNode[];
}

const treeSchema = Schema.recursive<TreeNode>(
  (self) =>
    ({
      type: 'object',
      properties: {
        value: { type: 'number' },
        children: { type: 'array', items: self }
      },
      required: ['value', 'children']
    }) as const
);
```

Note that the explicit `TreeNode` interface is required for the recursive node — this is a fundamental TypeScript limitation (a type alias can't directly reference itself), not a shortcut we chose to skip. Every non-recursive part of your schema tree still gets full type inference; only the self-referential node needs a hand-written interface.

`Schema.recursive` also supports **mutual recursion** between two or more schemas (e.g. `A` contains `B` contains `A`) — each schema's `build` callback can close over the other's `self` placeholder:

```ts
interface Author {
  name: string;
  books: Book[];
}
interface Book {
  title: string;
  author: Author;
}

const authorSchema = Schema.recursive<Author>(
  (self) =>
    ({
      type: 'object',
      properties: {
        name: { type: 'string' },
        books: { type: 'array', items: bookSchema }
      },
      required: ['name', 'books']
    }) as const
);

const bookSchema = Schema.recursive<Book>(
  (self) =>
    ({
      type: 'object',
      properties: {
        title: { type: 'string' },
        author: authorSchema
      },
      required: ['title', 'author']
    }) as const
);
```

Because recursive data isn't guaranteed to terminate at runtime (unlike the compile-time-bounded type), `Schema.recursive` takes an optional `maxDepth` (default: 50) that caps how deep validation will actually recurse into self-referential structures, guarding against unbounded/cyclic input data:

```ts
Schema.recursive<TreeNode>((self) => ({/* ... */}) as const, { maxDepth: 20 });
```

## Explicitly unsupported keywords

These are intentionally left out of `glacier-schema`, not simply "not yet implemented":

| Keyword(s)                                             | Reason                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `if` / `then` / `else`                                 | Conditional branching adds significant validation and type-inference complexity for relatively few real-world use cases.                                                                                                                                                                                                                    |
| `not`                                                  | Negation is hard to give a useful, precise static type to, and is rarely essential.                                                                                                                                                                                                                                                         |
| `allOf`, `anyOf`                                       | Only `oneOf` is supported for combining schemas, to keep the union type-inference engine simple (one strategy instead of three).                                                                                                                                                                                                            |
| `dependentRequired`, `dependentSchemas`                | Both express conditional logic keyed on property presence — the same category of complexity as `if`/`then`/`else`.                                                                                                                                                                                                                          |
| `unevaluatedProperties`, `unevaluatedItems`            | Require tracking evaluation across combinators/`$ref`; `additionalProperties: false` covers the common "strict object" case instead.                                                                                                                                                                                                        |
| `patternProperties`                                    | Combining it with `additionalProperties` creates the same "conflicting index signature" problem as combining `properties` with a schema-valued `additionalProperties`; dropping it keeps the object-type engine to a single strategy (`properties` + `additionalProperties: false`, or a bare `additionalProperties` schema — never mixed). |
| `$dynamicRef`, `$dynamicAnchor`                        | Advanced extensibility mechanism for vocabularies; rarely hand-written, high implementation cost.                                                                                                                                                                                                                                           |
| `contentEncoding`, `contentMediaType`, `contentSchema` | Niche, and the nested `contentSchema` type doesn't compose naturally with the outer string type.                                                                                                                                                                                                                                            |
| `$ref`, `$defs`, `$id`                                 | Superseded entirely by TypeScript-native composition (see [Composition](#composition)). `glacier-schema` schemas are not designed to be serialized as portable JSON Schema documents for other tools.                                                                                                                                       |

## The `null` type is not supported

`glacier-schema` does not support JSON's `null` anywhere:

- `type: "null"` is not a valid `type` value.
- `type` cannot be an array (so there is no `["string", "null"]` nullable shorthand).
- `null` cannot appear as a value in `enum` or as a `const` value.

If your data may be absent, model it as an **optional property** (omit it from `required`) rather than a nullable one.

## API reference

```ts
class Schema<T> {
  constructor(definition: /* JSON-Schema-shaped literal, use `as const` */);

  /** Validate `data`, collecting every error. Never throws. */
  validate(data: unknown): ValidationResult<T>;

  /** Metadata keywords captured from the schema definition (not used for validation). */
  readonly meta: {
    title?: string;
    description?: string;
    default?: unknown;
    examples?: unknown[];
    deprecated?: boolean;
    readOnly?: boolean;
    writeOnly?: boolean;
  };

  /** Build a self-referential schema (supports mutual recursion via closures). `T` must be supplied explicitly. */
  static recursive<T>(
    build: (self: Schema<T>) => /* JSON-Schema-shaped literal */,
    options?: { maxDepth?: number /* default: 50 */ },
  ): Schema<T>;

  /**
   * Assertion-style validation. Narrows `value` to `T` on success.
   * Throws a `SchemaValidationError` on failure instead of returning a result.
   */
  static assertValid<T>(schema: Schema<T>, value: unknown): asserts value is T;

  /** Type guard for `catch` blocks, mirroring Axios's `isAxiosError`. */
  static isValidationError(error: unknown): error is SchemaValidationError;
}

type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: ValidationError[] };

interface ValidationError {
  path: (string | number)[];
  keyword: string;
  message: string;
  params: Record<string, unknown>;
}

/** Thrown by `Schema.assertValid` when validation fails. */
class SchemaValidationError extends Error {
  readonly schema: unknown;
  readonly value: unknown;
  readonly errors: ValidationError[];
}

/** Extract the static type a `Schema` validates to. */
type Infer<S> = S extends Schema<infer T> ? T : never;
```
