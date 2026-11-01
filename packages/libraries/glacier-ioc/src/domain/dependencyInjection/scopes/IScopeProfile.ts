import type { IProviderScope } from "../metadata/types/IProviderScope.js";

/** Effective lifetime and request-binding state calculated for one provider registration. */
export interface IScopeProfile {
  /** Effective cache lifetime after dependency scope bubbling. */
  readonly lifetime: IProviderScope;
  /** True when this provider or a dependency is request-bound, regardless of transient lifetime. */
  readonly isRequestBound: boolean;
}
