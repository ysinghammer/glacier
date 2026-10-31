import { InjectionToken } from "./InjectionToken.js";
import type { ITokenReference } from "./types/ITokenReference.js";

const PATH_SEPARATOR = " -> ";
const ANONYMOUS_CLASS_DESCRIPTION = "<anonymous class>";

/** Formats token references and ordered dependency paths for container diagnostics. */
export class TokenDescription {
  /**
   * Formats one token using its class name or symbol description.
   * @param token Token reference to describe.
   * @returns Diagnostic label, including an anonymous-class fallback when needed.
   */
  public static describe(token: ITokenReference): string {
    if (token instanceof InjectionToken) return `InjectionToken(${token.description})`;
    if (typeof token === "symbol") return token.toString();
    return token.name === "" ? ANONYMOUS_CLASS_DESCRIPTION : token.name;
  }

  /**
   * Formats a dependency path from its first token through its final token.
   * @param path Ordered token references in the path.
   * @returns Labels joined by the diagnostic path separator; empty input returns an empty string.
   */
  public static describePath(path: readonly ITokenReference[]): string {
    return path.map((token) => TokenDescription.describe(token)).join(PATH_SEPARATOR);
  }
}
