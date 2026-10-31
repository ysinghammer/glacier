import type { IForbiddenKeys } from "./ILogFields.js";

/** A call carrying a message and optional structured fields. */
export type IMessageCall = { readonly [field: string]: unknown } & IForbiddenKeys<
  "err" | "level" | "time" | "context"
> & { readonly message: string };

/** A call carrying an error, an optional message and optional structured fields. */
export type IErrorCall = { readonly [field: string]: unknown } & IForbiddenKeys<
  "level" | "time" | "context"
> & { readonly err: Error; readonly message?: string };

/** The single argument of every level method. Bare strings are compile errors. */
export type ILogCall = IMessageCall | IErrorCall;
