import type { IProviderScope } from "../metadata/IProviderScope.js";

/** The effective lifetime of one registered provider after scope bubbling. */
export interface IScopeProfile {
  /** `"transient"` when declared so, `"request"` when declared or bubbled from a dependency, else `"default"`. */
  readonly lifetime: IProviderScope;
  /** Whether the provider is or depends on a REQUEST provider, so its dependents bubble to REQUEST. */
  readonly isRequestBound: boolean;
}
