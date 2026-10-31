import type { IForbiddenKeys } from "./ILogFields.js";

/** Message call with optional fields; `err` and logger-owned metadata keys are forbidden. */
export type IMessageCall = { readonly [field: string]: unknown } & IForbiddenKeys<
  "err" | "level" | "time" | "context"
> & { readonly message: string };

/** Error call with optional message and fields; logger-owned metadata keys are forbidden. */
export type IErrorCall = { readonly [field: string]: unknown } & IForbiddenKeys<
  "level" | "time" | "context"
> & { readonly err: Error; readonly message?: string };

/** Permitted argument of each level method; callers pass an object, not a bare string. */
export type ILogCall = IMessageCall | IErrorCall;
