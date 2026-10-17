/** A hand-written JSON Schema fragment that `JsonSchema` merges over the generated keywords of a field or class. */
export type IJsonSchemaFragment = { readonly [keyword: string]: unknown };
