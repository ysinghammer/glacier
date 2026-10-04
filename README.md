# Glacier

Workspace and engineering foundation; no product packages exist yet.

Use Node.js **24.21.0** and pnpm **11.9.0**. With nvm, run:

```sh
nvm install
nvm use
pnpm install --frozen-lockfile
pnpm check
```

Installation activates Husky for local commits. If a checkout was installed with lifecycle scripts disabled,
run `pnpm hooks:setup`. CI disables hooks and runs the same quality gates independently.

See the [engineering setup and commands](.docs/Engineering/Guidelines/Overview.md#workspace-setup),
[CI and integration setup](.docs/Engineering/CI/Overview.md), and the [project wiki](.docs/Home.md).

`pnpm check` verifies workspace tooling and the empty acceptance inventory. It does **not** run application
acceptance tests, library coverage, or container scans: no corresponding packages or images exist.
Snyk and Renovate require owner activation and observed remote results; committed configuration alone is
not evidence of active integrations.
