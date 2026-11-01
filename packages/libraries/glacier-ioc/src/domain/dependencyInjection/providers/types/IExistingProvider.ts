import type { ITokenReference } from "../../tokens/types/ITokenReference.js";

/** Provider alias that resolves one requested token through another token's registration. */
export interface IExistingProvider {
  /** Alias token consumers request. */
  readonly provide: ITokenReference;
  /** Existing token whose provider supplies the shared value. */
  readonly useExisting: ITokenReference;
}
