import { ValueMetadataDefinition } from "@glacier/reflection";
import type { IMetadataRead } from "@glacier/reflection";
import type { IApiControllerOptions } from "./IApiControllerOptions.js";
import type { IApiRouteOptions } from "./IApiRouteOptions.js";
import type { IApiResponseOptions } from "./IApiResponseOptions.js";

/** Cohesive private endpoint definitions; consumers cannot reset or inspect these identities. */
export class RoutingMetadata {
  static readonly controller = new ValueMetadataDefinition<{
    readonly path: string;
    readonly options: IApiControllerOptions;
  }>("http controller");
  static readonly route = new ValueMetadataDefinition<{
    readonly path: string;
    readonly options: IApiRouteOptions;
  }>("http get route");
  static readonly response = new ValueMetadataDefinition<IApiResponseOptions>("http response");

  /** Rejects incomplete/invalid metadata through the same public reflection outcome contract. */
  public static require<T>(result: IMetadataRead<T>): T {
    const value = RoutingMetadata.optional(result);
    if (value === undefined) throw new TypeError("Missing HTTP metadata");
    return value;
  }

  /** Narrows public metadata outcomes, distinguishing absent declarations from invalid targets. */
  public static optional<T>(result: IMetadataRead<T>): T | undefined {
    if (!result.isValid) throw new TypeError("Invalid HTTP metadata");
    return result.isPresent ? result.value : undefined;
  }

  /** Fixed/parameter route paths must be origin-form and free from query/fragments or dot segments. */
  public static validatePath(path: string): void {
    if (
      typeof path !== "string" ||
      !path.startsWith("/") ||
      /[?#%\\]/.test(path) ||
      [...path].some(
        (character) => character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
      )
    )
      throw new TypeError("Invalid route path");
    if (
      path
        .split("/")
        .some(
          (part) =>
            part === "." ||
            part === ".." ||
            (part.includes(":") && !/^:[A-Za-z][A-Za-z0-9_]*$/.test(part)),
        )
    )
      throw new TypeError("Invalid route segment");
  }
}
