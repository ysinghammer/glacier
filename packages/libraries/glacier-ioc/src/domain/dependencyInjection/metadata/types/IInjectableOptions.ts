import type { IProviderScope } from "./IProviderScope.js";

/** Scope options recorded by the `@Injectable` decorator. */
export interface IInjectableOptions {
  /**
   * Provider lifetime declared directly on the class.
   * @default `"default"` when omitted.
   */
  readonly scope?: IProviderScope;
}
