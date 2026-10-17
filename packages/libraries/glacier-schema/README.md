# @glacier/schema

Private, native ESM class-based schema validation and transformation built on
[`@glacier/reflection`](../glacier-reflection/README.md). Decorated classes act as validator and
transformer in one pipeline. This package is a scaffold: it has no public exports yet.

## Public API

Only the package root is exported (`"."`); there are no subpaths or deep imports.

## Setup

Requires legacy decorators and compiler metadata, so consumers enable `experimentalDecorators` and
`emitDecoratorMetadata` and import `@glacier/reflection/register` first (this library never registers it itself).

## Scenarios

See [tests/scenarios/README.md](tests/scenarios/README.md).
