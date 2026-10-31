/** Keyword-valued document/fragment; manual unknown-valued overrides require separate JSON-safety checks. */
export type IJsonSchema = { readonly [keyword: string]: unknown };
