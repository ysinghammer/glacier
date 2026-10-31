import type { IReservedKey } from "./IReservedKey.js";

/** Forbids `Keys` at the type level while leaving every other property free. */
export type IForbiddenKeys<Keys extends string> = { readonly [Key in Keys]?: never };

/** Free-form structured data. Reserved keys are compile errors. */
export type ILogFields = { readonly [field: string]: unknown } & IForbiddenKeys<IReservedKey>;
