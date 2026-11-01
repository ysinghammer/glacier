# @glacier/orm

This package is the scaffold for a PostgreSQL library. Its root entry currently exports no API
and does not open a database connection. SQL, transactions, migrations, and other functionality
have not yet been implemented.

The package builds with `pnpm --filter @glacier/orm build` and runs its scenario and coverage
checks with `pnpm --filter @glacier/orm test`. Type contracts are checked by
`pnpm --filter @glacier/orm lint:types` after the package is built.
