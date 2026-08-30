import type { ISchemaMeta } from '../../definition/_interfaces/ISchemaMeta.js';
import type { TSchemaNode } from '../../definition/TSchemaNode.js';

/**
 * Pure, stateless extraction of the metadata keywords captured from a
 * schema definition (not used for validation, only for introspection via
 * `Schema.prototype.meta`).
 */
export function extractSchemaMeta(definition: TSchemaNode): ISchemaMeta {
  return {
    title: definition.title,
    description: definition.description,
    default: definition.default,
    examples: definition.examples,
    deprecated: definition.deprecated,
    readOnly: definition.readOnly,
    writeOnly: definition.writeOnly
  };
}
