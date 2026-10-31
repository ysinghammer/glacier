import type { ITokenReference } from "../../tokens/types/ITokenReference.js";

/**
 * Provider that supplies the given value unchanged on every lookup, including `undefined`.
 * @template T Value supplied to consumers; defaults to `unknown`.
 */
export interface IValueProvider<T = unknown> {
  /** Token consumers request to receive this value. */
  readonly provide: ITokenReference;
  /** Readonly reference to the exact value returned on each lookup. */
  readonly useValue: T;
}
