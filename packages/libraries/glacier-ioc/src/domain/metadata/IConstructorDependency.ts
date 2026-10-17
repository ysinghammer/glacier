import type { IToken } from "../tokens/IToken.js";

/** One constructor parameter of an injectable class after explicit and implicit tokens are merged. */
export interface IConstructorDependency {
  /** Zero-based constructor parameter position. */
  readonly position: number;
  /** The token to resolve: an `@Inject` token or the compiler-emitted parameter type. */
  readonly token: IToken;
  /** Whether `@Optional` allows the dependency to resolve to `undefined`. */
  readonly isOptional: boolean;
}
