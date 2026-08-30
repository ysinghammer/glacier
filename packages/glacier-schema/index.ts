// Barrel file: re-export all public members of the @glacier/schema package.
// This is the package's sole npm entry point (required by package.json's
// "main"/"types"/"exports" fields) — internal modules never import through
// this file, they always import the file that defines the symbol directly.
export { Schema } from './src/schema/Schema.js';
export { AppError } from './src/validation/_exceptions/AppError.js';
export { SchemaValidationError } from './src/validation/_exceptions/SchemaValidationError.js';
export { UnsupportedSchemaError } from './src/validation/_exceptions/UnsupportedSchemaError.js';
export { MaxRecursionDepthExceededError } from './src/validation/_exceptions/MaxRecursionDepthExceededError.js';
export type { Infer } from './src/definition/Infer.js';
export type { IValidationError } from './src/validation/_interfaces/IValidationError.js';
export type { ValidationResult } from './src/validation/ValidationResult.js';
export type { IArraySchemaNode } from './src/definition/_interfaces/IArraySchemaNode.js';
export type { IBooleanSchemaNode } from './src/definition/_interfaces/IBooleanSchemaNode.js';
export type { IClosedObjectSchemaNode } from './src/definition/_interfaces/IClosedObjectSchemaNode.js';
export type { INumberSchemaNode } from './src/definition/_interfaces/INumberSchemaNode.js';
export type { IOneOfSchemaNode } from './src/definition/_interfaces/IOneOfSchemaNode.js';
export type { IOpenObjectSchemaNode } from './src/definition/_interfaces/IOpenObjectSchemaNode.js';
export type { ISchemaMeta } from './src/definition/_interfaces/ISchemaMeta.js';
export type { IStringSchemaNode } from './src/definition/_interfaces/IStringSchemaNode.js';
export type { TFormat } from './src/definition/TFormat.js';
export type { TObjectSchemaNode } from './src/definition/TObjectSchemaNode.js';
export type { TSchemaLike } from './src/definition/TSchemaLike.js';
export type { TSchemaNode } from './src/definition/TSchemaNode.js';
