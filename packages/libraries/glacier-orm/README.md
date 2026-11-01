# @glacier/orm

This package is an early PostgreSQL library. Importing it does not open a database connection.
Transactions and migrations have not yet been implemented.

## Database access

```ts
import { DbFactory, Sql } from "@glacier/orm";
import { IsInt } from "@glacier/schema";

/** A query projection. */
class Count {
  /** Number of matching rows. */
  @IsInt()
  public count!: number;
}

const db = DbFactory.create({ poolConfig: { connectionString: process.env.DATABASE_URL } });
try {
  const result = await db.one(Count, Sql.tag`select count(*)::int as count from users`);
  console.log(result.count);
} finally {
  await db.close();
}
```

Supply either `pool` or `poolConfig`, not both. `db.pool` exposes the underlying node-postgres pool;
`close()` ends it even when supplied by the caller. Pool construction is lazy. Both `query` and
`many` return arrays of validated rows, including an empty array. `one` requires exactly one row;
`maybeOne` returns `undefined` for no rows and rejects multiple rows. Cardinality is checked before
row mapping. `execute` returns one PostgreSQL count (or `null` when unavailable); a multi-statement
result returns an ordered array of counts and nulls, never a fabricated count. Row-returning methods
reject multiple result sets rather than silently combining them. PostgreSQL's extended protocol does
not allow multiple commands in a statement with bound values; use separate calls when parameters are
needed. Multi-statement SQL without parameters uses the simple protocol.

When PostgreSQL execution succeeds, subsequent observer, cardinality, row-mapping, or multi-result
failures do not undo database effects. PostgreSQL controls the atomicity of SQL execution, and this
API does not provide transactions yet. All calls parameterize interpolated values and release pool
clients.

`onQuery` receives one event for each PostgreSQL execution, before row mapping or
cardinality checks. It contains compiled text, elapsed milliseconds, the reported row count (or null),
and a generic error summary on failure, never bound values or raw database errors. Multi-statement
successes report an ordered array of counts. SQL literals may contain sensitive data. Observer
failures propagate; if execution and the observer both fail, an
`AggregateError` retains both. Asynchronous observers are awaited. Known PostgreSQL errors
are translated. Unrecognized PostgreSQL server errors receive a generic summary with the original
error as cause. Causes and non-server errors can contain secrets and require careful handling.

### Query logging

```ts
import { LoggerFactory } from "@glacier/logger";
import { DbFactory, QueryLogHook } from "@glacier/orm";

declare const factory: LoggerFactory; // Configure a factory and its transports in application composition.
const loggerResult = factory.createLogger("database");
if (loggerResult.outcome === "created") {
  const result = QueryLogHook.create(loggerResult.logger, { slowQueryMs: 100 });
  if (result.outcome === "created") {
    const db = DbFactory.create({ onQuery: result.hook });
    // Use db, then await db.close().
    await db.close();
  }
}
```

Creation requires a `Logger` instance from the same installed copy of `@glacier/logger`. It rejects
an invalid logger or a missing, negative, nonnumeric, NaN, or infinite threshold
with `invalid_logger` or `invalid_slow_query_ms`. Zero is valid. For each database execution, the
adapter sends `durationMs` and exactly one fixed message: `Database query failed` at error on
failure, `Slow database query` at warn when a successful query meets or exceeds the threshold,
otherwise `Database query completed` at debug. Logger level and transport filtering still apply.
The adapter never passes SQL text, parameters, row counts, error objects, messages, or causes to
the logger; raw SQL literals may be secrets. Logger-owned context, bindings, timestamp, redaction,
and transports remain caller-controlled and must also be configured safely. The hook expects events
from `DbFactory`; a directly supplied invalid duration throws `TypeError`. Logger/observer failures
follow the database observer propagation rules above; transport failures follow logger policy.

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
`SqlFragment.parameter(value)` binds any value, even a `SqlFragment`, as one parameter rather than
composing it as SQL.

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

`TableMapping.isTable(Class)` checks inherited or direct table declarations without preparing or
freezing metadata. It rejects invalid class targets rather than treating them as undecorated.

## Write fragments

`Sql.values(Table, rowOrRows)` validates every logical insert row and returns a typed result. On success,
`value` contains the quoted column list and parameterized tuples; all rows must have the same normalized
column set. `Sql.set(Table, patch)` validates a nonempty shallow partial and returns parameterized assignments.
Only successful results carry an interpolatable fragment; failures carry `issues`. Database or schema
definition failures remain exceptional. Neither helper executes SQL.

```ts
const insert = Sql.values(User, { displayName: "Ada" });
if (insert.ok) {
  const query = Sql.tag`insert into ${Sql.ident("users")} ${insert.value}`;
  console.log(query.compile());
}
```

Declare generated/defaulted fields optional with TypeScript `?` and schema `Optional()` when appropriate.
Schema defaults are included as normalized insert values, except omitted `generated()` or `dbDefault()`
fields remain omitted even if schema defaults populate them. Provided fields are always validated. Inserts
run full class refinements against the parsed candidate, which may not match database-generated values.
Updates drop top-level defaults and class refinements; full-row invariants require separate full-row or
database validation. Nested fields retain their own schema defaults and refinements.

Both helpers bind normalized logical values, not JSON projections or necessarily the caller's original
objects. SQL fragments supplied as field values are parameters, not SQL syntax. Unknown own properties,
symbols, empty rows, explicitly undefined values, and supplied values transformed to undefined are rejected.
Multi-row issue paths start with the zero-based row index; mismatched column sets are also typed failures.
Native schema validation does not guarantee every accepted value can be encoded by `pg` for a given column.
Issues inherited from schema validation may contain input values or callback details; redact them at public
transport boundaries.

## Mapping result rows

```ts
import { RowMapper } from "@glacier/orm";
import { IsBigInt, IsNumber } from "@glacier/schema";

/** Result of a SQL projection or a direct pg pool query. */
class Total {
  /** PostgreSQL int8 can arrive as text. */
  @IsBigInt()
  public id!: bigint;

  /** PostgreSQL numeric can arrive as text. */
  @IsNumber()
  public amount!: number;
}

const totals = RowMapper.map(Total, [{ id: "42", amount: "12.50" }]);
// totals[0] is a Total with id 42n and amount 12.5.
```

Every row is passed to `Schema.parse` with coercion enabled, including nested JSON objects and
arrays already decoded by `pg`. Schema coercion applies to all supported types, not only database
numeric types; use bigint for exact large integers, since number conversion can lose precision.
For arbitrary schema classes, SQL aliases must match schema wire names, including `Rename`.
For table classes, only declared database columns are mapped to their schema wire names; column
overrides take precedence, unrecognized columns are ignored, and missing columns are validated.
Nested JSON keys must use the nested schema's wire names, not its table column names. Mapping does
not mutate rows. Table mapping is prepared even when the result is empty.

The first invalid row throws `RowValidationError` with its zero-based index, schema issues, and
schema error cause. The summary message omits row values, but issues and causes can contain
sensitive details and must not be exposed or logged without review. Schema definition and callback
exceptions propagate unchanged. No database connection is required to use the mapper.

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
