import type { IProviderScope } from "./IProviderScope.js";

/** Options of `@Injectable`. */
export interface IInjectableOptions {
  /** Provider lifetime; omitted means `"default"`. */
  readonly scope?: IProviderScope;
}
