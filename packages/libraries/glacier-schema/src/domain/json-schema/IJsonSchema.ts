/** A JSON Schema document or fragment: a plain, JSON-serialisable object keyed by schema keyword. */
export type IJsonSchema = { readonly [keyword: string]: unknown };
