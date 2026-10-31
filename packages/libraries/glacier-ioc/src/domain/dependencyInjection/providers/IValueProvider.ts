import type { ITokenReference } from "../tokens/ITokenReference.js";

/** Provider that returns a ready-made value exactly as supplied, including `undefined`. */
export interface IValueProvider<T = unknown> {
  /** The token consumers request. */
  readonly provide: ITokenReference;
  /** The value handed out unchanged on every lookup. */
  readonly useValue: T;
}
