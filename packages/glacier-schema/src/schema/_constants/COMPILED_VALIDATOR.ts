/**
 * Symbol-keyed accessor letting sibling modules within this package (e.g.
 * `SchemaCompiler`, `RecursiveSchemaBuilder`) reach a schema's
 * already-compiled validator, without exposing it as part of the
 * package's public, documented API surface.
 */
export const COMPILED_VALIDATOR = Symbol('glacier-schema:compiledValidator');
