import type { ITokenReference } from "../tokens/ITokenReference.js";

/** Provider that aliases one token to another so both resolve to the same instance. */
export interface IExistingProvider {
  /** The alias token consumers request. */
  readonly provide: ITokenReference;
  /** The token whose provider supplies the value. */
  readonly useExisting: ITokenReference;
}
