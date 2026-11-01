# @glacier/orm

This package is an early PostgreSQL library. Importing it does not open a database connection.
Querying, transactions, migrations, and write helpers have not yet been implemented.

## SQL composition

```ts
import { Sql } from "@glacier/orm";

const ids = [1, 2];
const condition = Sql.tag`${Sql.ident("id")} = any(${ids})`;
const query = Sql.tag`select * from ${Sql.ident("users")} where ${condition}`;
const { text, values } = query.compile();
// text: 'select * from "users" where "id" = any($1)'; values: [ids]
```

Values, including arrays, are parameters; nested fragments compose with numbering assigned at
compilation. `Sql.join(items, separator)` joins values or fragments with a fragment separator
(default `Sql.raw(", ")`); an empty list produces empty SQL. `Sql.ident(name)` quotes a single
identifier, including any dots. `Sql.raw(text)` inserts text verbatim and is unsafe for untrusted
input. Direct `SqlFragment` construction also treats template segments as trusted SQL.
Fragment structure is immutable, but referenced parameter objects are neither copied nor frozen.
Each compilation returns a new caller-owned values array compatible with `pg` query configuration.

## Table mappings

```ts
import { TableMapping } from "@glacier/orm";
import { IsString, Optional, Rename } from "@glacier/schema";

/** Persisted user schema. */
@TableMapping.table("users")
class User {
  /** The database generates this identifier; callers may omit it. */
  @IsString()
  @Optional()
  @TableMapping.generated()
  public id?: string;

  /** Schema wire name and database column can be specified independently. */
  @IsString()
  @Rename("display_wire")
  @TableMapping.column("display_name")
  public displayName!: string;
}

const mapping = TableMapping.read(User);
// mapping.propertyToColumn.displayName is "display_name"; wireName remains "display_wire".
void mapping;
```

`table(name)` declares an explicit identifier, inherited unless a subclass declares its own. Every schema field
maps to a column: `column(name)` wins over an inherited or local `Rename`, an explicit `Rename` wins over the
default, and otherwise ASCII camel-case and acronym boundaries become snake_case. Identifiers are returned raw,
not SQL-quoted. Empty identifiers and NUL are rejected. Decorators apply only to instance properties; every
annotated field must have a schema declaration. Duplicate same-kind annotations on one class and duplicate
effective columns are rejected. Descendant column annotations override inherited ones; generated and default
markers accumulate across inheritance and can coexist.

`generated()` and `dbDefault()` mark runtime insert optionality; declare the corresponding TypeScript property
with `?` too. Schema optionality is independent: use schema `Optional()` when parsing may omit that field.
`read()` returns frozen field entries, bidirectional null-prototype lookup records, and an ordered array of
insert-optional property names. It validates mappings, freezes ORM declarations on the class and its ancestors,
and prepares the schema. Preparation also freezes reachable schema metadata and may invoke nested type
resolvers. Failed preparation does not roll back either freeze. Calling
`Schema.prepare()` or parsing independently freezes only schema metadata; ORM decorators remain mutable until a
`read()` reaches schema preparation. Root unions, invalid schemas, unknown annotated fields and column collisions
are rejected; errors found before preparation do not freeze ORM declarations.

## Errors

`PgErrors.map` translates the six supported SQLSTATEs from `pg.DatabaseError` into
`UniqueViolation`, `ForeignKeyViolation`, `NotNullViolation`, `CheckViolation`,
`SerializationFailure`, or `DeadlockDetected`. Each extends `PgError` and `OrmError`, retaining
`code`, optional `constraint`, and the original error as `cause`. Unknown PostgreSQL errors and
other caught values are returned unchanged. Mapping does not throw or perform I/O.

```ts
import { PgErrors, UniqueViolation } from "@glacier/orm";

declare const caughtValue: unknown; // A value caught from a database operation.
const mapped = PgErrors.map(caughtValue);
if (mapped instanceof UniqueViolation) {
  console.log(mapped.code, mapped.constraint);
}
```

`NoRowsError` and `TooManyRowsError` describe cardinality failures; `RowValidationError` stores a
zero-based row index and schema issues. These classes do not execute queries or throw on their own.
Treat expected validation or business rejections as typed outcomes, not thrown errors. The original
database cause and constraint can contain sensitive details and should not be exposed to clients.

The package builds with `pnpm --filter @glacier/orm build` and runs its scenario and coverage
checks with `pnpm --filter @glacier/orm test`. Type contracts are checked by
`pnpm --filter @glacier/orm lint:types` after the package is built.
