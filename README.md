# Glacier

Workspace and engineering foundation with the [reflection library](packages/libraries/glacier-reflection/README.md) and the [IoC library](packages/libraries/glacier-ioc/README.md).
No deployable applications or services exist yet.

Use Node.js **24.21.0** and pnpm **11.9.0**. With nvm, run:

```sh
nvm install
nvm use
pnpm install --frozen-lockfile
pnpm run ci
```

Installation activates Husky for local commits. If a checkout was installed with lifecycle scripts disabled,
run `pnpm exec husky` with authorization to reactivate the existing installation.
Pre-commit checks the full working tree through `pnpm exec turbo run ci`;
CI disables hooks and runs the same quality graph independently.

See the [compliance and quality commands](.policies/0001-compliance.md),
[development workflow](.policies/0013-development-workflow.md),
[workspace task graph](turbo.json), and [quality CI](.github/workflows/quality.yml).

`pnpm run ci` checks lint/format, reflection build and strict typing, and the Node-only public library
tests with V8 coverage. For an uncached complete gate, run `pnpm exec turbo run ci --force`.
Reflection's direct Vitest command also prepares genuine compiler fixtures and independent generated consumers.
There is no application/service acceptance suite or applicable container image scan yet.
Snyk and Renovate require owner activation and observed remote results; committed configuration alone is
not evidence of active integrations.
