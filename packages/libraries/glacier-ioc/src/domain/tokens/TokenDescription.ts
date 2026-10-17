import { InjectionToken } from "./InjectionToken.js";
import type { ITokenReference } from "./ITokenReference.js";

const PATH_SEPARATOR = " -> ";
const ANONYMOUS_CLASS_DESCRIPTION = "<anonymous class>";

/** Renders tokens and dependency paths as stable diagnostic text for error messages. */
export class TokenDescription {
  /** Describes one token: class name, `InjectionToken(description)` or `Symbol(description)`. */
  public static describe(token: ITokenReference): string {
    if (token instanceof InjectionToken) return `InjectionToken(${token.description})`;
    if (typeof token === "symbol") return token.toString();
    return token.name === "" ? ANONYMOUS_CLASS_DESCRIPTION : token.name;
  }

  /** Describes an ordered dependency path from the requested token to the failing one. */
  public static describePath(path: readonly ITokenReference[]): string {
    return path.map((token) => TokenDescription.describe(token)).join(PATH_SEPARATOR);
  }
}
