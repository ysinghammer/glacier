# @glacier/orm

This package is an early PostgreSQL library. Importing it does not open a database connection.
SQL, querying, transactions, migrations, and other functionality have not yet been implemented.

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
