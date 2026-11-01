import type { IReservedKey } from "./IReservedKey.js";

/** Builds a readonly string-keyed shape where selected keys are forbidden.
 * @template Keys - String keys that must not have values.
 */
export type IForbiddenKeys<Keys extends string> = { readonly [Key in Keys]?: never };

/** Free-form structured call fields that exclude logger-owned reserved keys. */
export type ILogFields = { readonly [field: string]: unknown } & IForbiddenKeys<IReservedKey>;
