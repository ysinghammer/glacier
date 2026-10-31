/**
 * JSON Schema keyword map; unknown values require runtime JSON-safety validation when supplied manually.
 * @property [keyword] Schema keyword or extension value.
 */
export type IJsonSchema = { readonly [keyword: string]: unknown };
