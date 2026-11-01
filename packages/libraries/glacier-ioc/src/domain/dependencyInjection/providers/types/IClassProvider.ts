import type { IProviderScope } from "../../metadata/types/IProviderScope.js";
import type { ITokenReference } from "../../tokens/types/ITokenReference.js";
import type { IClassConstructor } from "./IClassConstructor.js";

/** Provider that constructs a class with resolved constructor dependencies. */
export interface IClassProvider {
  /** Token consumers request to receive the constructed instance. */
  readonly provide: ITokenReference;
  /** Implementation class constructed for this provider. */
  readonly useClass: IClassConstructor;
  /**
   * Lifetime override; when omitted, uses `useClass` metadata or `"default"`.
   * @default The `@Injectable` scope, or `"default"` when undeclared.
   */
  readonly scope?: IProviderScope;
}
