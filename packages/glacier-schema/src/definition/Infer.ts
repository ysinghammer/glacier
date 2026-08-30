import type { Schema } from '../schema/Schema.js';

/** Extract the static type a `Schema` validates to. */
export type Infer<S> = S extends Schema<infer _D, infer T> ? T : never;
