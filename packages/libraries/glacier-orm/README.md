# @glacier/orm

This package is a thin PostgreSQL library for writing SQL, validating results, and running migrations.
Importing it does not open a database connection. Its public API is exported from the package root.

## Quick start

Install the workspace packages used by the application, including `@glacier/orm`, `@glacier/schema`, and
`@glacier/reflection`. Enable TypeScript's `experimentalDecorators` and `emitDecoratorMetadata`, and import
`@glacier/reflection/register` before modules containing decorated classes execute. See the
[schema quick start](../glacier-schema/README.md#quick-start). Set `DATABASE_URL` securely and apply a
migration creating `users (id bigint generated always as identity primary key, name text not null)`.

```ts
import "@glacier/reflection/register";
import { DbFactory, Sql, TableMapping } from "@glacier/orm";
import { IsBigInt, IsString, Optional } from "@glacier/schema";

@TableMapping.table("users")
class User {
  @IsBigInt()
  @Optional()
  @TableMapping.generated()
  public id?: bigint;

  @IsString({ min: 1, trim: true })
  public name!: string;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = DbFactory.create({ poolConfig: { connectionString: databaseUrl } });
try {
  const insert = Sql.values(User, { name: " Ada " });
  if (!insert.ok) {
    // Handle insert.issues as an expected validation rejection, with boundary-safe redaction.
    console.error("Invalid user input");
  } else {
    const user = await db.one(User, Sql.tag`insert into users ${insert.value} returning id, name`);
    const matches = await db.many(User, Sql.tag`select id, name from users where id = ${user.id}`);
    console.log(matches.length); // 1; the inserted name was normalized to "Ada".
  }
} finally {
  await db.close();
}
```

The examples below use an active `db` from application composition unless they construct their own. SQL
in template literals is trusted; interpolated ordinary values are bound parameters. See
[write fragments](#write-fragments) for handling both insert and update outcomes and
[migrations](#migrations) for creating the tables.

## Migrations

Set `DATABASE_URL` to a PostgreSQL connection URL, then run the declared executable:

```sh
glacier-orm migrate --dir ./migrations
```

`--database-url` overrides `DATABASE_URL`; one is required. URLs must use `postgres:` or
`postgresql:` and include a hostname. Prefer the environment variable when credentials are present:
command-line arguments can be visible in process listings. The directory must exist. SQL files use contiguous names
starting with `0001`, such as `0001_create_users.sql` and `0002_add_index.sql`. Names have exactly
four digits, an underscore, and a name beginning with an ASCII letter or digit followed by ASCII
letters, digits, underscores, or hyphens. Other non-`.sql` entries are ignored. SQL files must be
regular, non-symlink UTF-8 files. An empty directory is valid for an empty migration history.

The CLI applies files in order, recording each filename and SHA-256 checksum of its original bytes
in `glacier_migrations` on the connection's search path. Applied files must remain present, unchanged,
and in the same order. A mismatch fails before any pending file executes; migrations are forward-only.
One dedicated PostgreSQL session holds a database-wide advisory lock for the entire history check
and execution. Other instances wait until the session closes, including after an execution failure.

Each file normally runs in one transaction together with its history record. A file whose first
line is exactly `-- glacier:no-transaction` opts out, for commands such as `CREATE INDEX CONCURRENTLY`.
An opt-out file and its history write are not atomic: failures can leave SQL effects without a history
record and may require manual recovery before retrying. PostgreSQL may group multiple statements sent
in one query into an implicit transaction, so use a single statement for commands requiring no
transaction. Migration SQL is trusted: do not issue transaction-control statements, release advisory
locks, or alter `glacier_migrations` from a file, as those can defeat these guarantees.

Exit status is `0` for success, `2` for invalid command-line arguments, and `1` for migration or
connection failures. Diagnostics do not print connection URLs, file contents, or raw database errors.
PostgreSQL server logs can still contain SQL. There is no programmatic migration API.

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

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const db = DbFactory.create({ poolConfig: { connectionString: databaseUrl } });
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

Outside transactions, subsequent observer, cardinality, row-mapping, or multi-result failures do not
undo successful database effects. Ordinary interpolated values are parameters, and pool clients are released.

### Application composition and lifecycle

Registration is explicit; the ORM does not depend on or register itself with `@glacier/ioc`. An application
that already uses the workspace IoC package can register its database as a value provider. This example
closes the container first so its dependents can finish using the database, then closes the database even
if container creation or shutdown fails. It retains failures from both work and cleanup:

```ts
import "@glacier/reflection/register";
import { GlacierContainer, Module } from "@glacier/ioc";
import { Database, DbFactory, Sql } from "@glacier/orm";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const database = DbFactory.create({ poolConfig: { connectionString: databaseUrl } });

@Module({ providers: [{ provide: Database, useValue: database }], exports: [Database] })
class AppModule {}

let container: GlacierContainer | undefined;
const failures: unknown[] = [];
try {
  container = await GlacierContainer.create(AppModule);
  const registeredDatabase = container.get(Database);
  await registeredDatabase.execute(Sql.tag`select 1`);
  // Start and stop application resources that depend on the database here.
} catch (error: unknown) {
  failures.push(error);
} finally {
  try {
    await container?.close();
  } catch (error: unknown) {
    failures.push(error);
  }
  try {
    await database.close();
  } catch (error: unknown) {
    failures.push(error);
  }
}
if (failures.length > 0) throw new AggregateError(failures, "Application lifecycle failed");
```

The application owns the database's explicit `close()`; container shutdown does not call it automatically.
Constructing the pool is not a readiness check: coordinate startup, partial-failure cleanup and shutdown
for all application resources, and treat aggregated causes as potentially sensitive. See the
[IoC lifecycle documentation](../glacier-ioc/README.md#lifecycle-and-close).

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

## Transactions

This example assumes `users(name)` and `audit_log(event)` exist:

```ts
const result = await db.transaction(
  async (tx) => {
    await tx.execute(Sql.tag`insert into users (name) values (${"Ada"})`);
    await tx.transaction(async (nested) => {
      await nested.execute(Sql.tag`insert into audit_log (event) values (${"user created"})`);
    });
    return "created";
  },
  { isolation: "serializable" },
);
```

The callback runs on one dedicated pool client; it commits on success and rolls back on callback failure.
Its handle implements `IQueryable`, is valid only within the callback, and nested transactions use
savepoints. A nested failure can be caught to continue the outer transaction after rollback to its
savepoint. Nested calls reject an isolation setting. Top-level isolation may be `read committed`,
`repeatable read`, or `serializable`; omitting it uses PostgreSQL's default. Await all operations,
including nested callbacks, before returning. A parent handle cannot be used while its nested
callback is active. Do not issue transaction-control SQL manually through the handle; the API cannot
guarantee transaction integrity if you do.

Observers are awaited for transaction-control commands as well as ordinary queries. A failed
`BEGIN` observer triggers rollback if the server began the transaction. If `COMMIT` succeeded but
its observer failed, `CommittedObserverError` means the data **was committed**, and its `cause` is
the observer error; no rollback is attempted. If client release fails after a successful commit,
`CommittedReleaseError` likewise indicates the data **was committed**, with the original release
failure as its `cause`. When both observation and release fail after commit, an `AggregateError`
contains both committed-state errors. Rollback and other release failures also remain observable,
including alongside the original error in an `AggregateError`. Observer errors and error causes
may contain sensitive details. A broken connection or interrupted pool release can require pool
recovery; never assume that an arbitrary failure means a transaction did not commit.

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
identifier, including any dots; compose separate identifiers and a trusted `.` for a qualified name.
`Sql.raw(text)` inserts text verbatim and is unsafe for untrusted input. Never pass user input, secrets,
or interpolated strings to `Sql.raw`; bind values instead, and select SQL syntax from trusted code.
Direct `SqlFragment` construction also treats template segments as trusted SQL.
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

Using the `User` mapping above, this example assumes a `users` table with a string `id` and
`display_name` column; it is separate from the quick start's bigint `id` and `name` table.

```ts
const insert = Sql.values(User, { displayName: "Ada" });
if (insert.ok) {
  await db.execute(Sql.tag`insert into ${Sql.ident("users")} ${insert.value}`);
} else {
  // Handle insert.issues as an expected rejection; do not expose raw issues.
}

const update = Sql.set(User, { displayName: "Grace" });
if (update.ok) {
  await db.execute(
    Sql.tag`update ${Sql.ident("users")} set ${update.value} where id = ${"user-id"}`,
  );
} else {
  // Handle update.issues as an expected rejection; do not expose raw issues.
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

### Nested PostgreSQL results

PostgreSQL builds nested JSON; the ORM validates the decoded objects rather than loading relations.
For example, with `users(id)` and `orders(id, user_id, amount numeric)`, the following projection
returns a user and an empty array when there are no orders. The snippet uses the active `db` and a
caller-provided `userId: bigint`:

```ts
import { IsArray, IsBigInt, IsNumber } from "@glacier/schema";
import { Sql } from "@glacier/orm";

class OrderSummary {
  @IsBigInt() public id!: bigint;
  @IsNumber() public amount!: number;
}

class UserOrders {
  @IsBigInt() public userId!: bigint;
  @IsArray(OrderSummary) public orders!: OrderSummary[];
}

const result = await db.maybeOne(
  UserOrders,
  Sql.tag`
  select u.id::text as "userId",
    coalesce(
      (select json_agg(json_build_object('id', o.id::text, 'amount', o.amount::text) order by o.id)
       from orders o where o.user_id = u.id),
      '[]'::json
    ) as orders
  from users u where u.id = ${userId}
`,
);
// result is undefined when the user does not exist; otherwise orders contain OrderSummary instances.
```

Casting the bigint to text before JSON construction avoids JSON number precision loss before schema
coercion. `IsNumber` converts the numeric text to a JavaScript number, which can lose decimal precision;
use a suitable exact representation when precision matters. For renamed fields, SQL aliases and nested
JSON keys must follow the wire-name rules above.

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
  console.log("A unique constraint was violated");
}
```

`NoRowsError` and `TooManyRowsError` describe cardinality failures; `RowValidationError` stores a
zero-based row index and schema issues. These classes do not execute queries or throw on their own.
Treat expected validation or business rejections as typed outcomes, not thrown errors. The original
database cause and constraint can contain sensitive details and should not be exposed to clients.

The package builds with `pnpm --filter @glacier/orm build` and runs its scenario and coverage
checks with `pnpm --filter @glacier/orm test`. Type contracts are checked by
`pnpm --filter @glacier/orm lint:types` after the package is built. Runtime coverage reports measure
emitted JavaScript, combining package-root scenarios with CLI subprocesses; they are not source-mapped.
CI verifies a one-to-one inventory of executable sources and emitted files and enforces per-file
thresholds on the emitted coverage. Integration scenarios require Docker and real PostgreSQL containers;
type-only exports are checked separately and are not runtime coverage.
