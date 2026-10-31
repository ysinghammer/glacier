import type { IApiResponseOptions } from "./IApiResponseOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Adds one success status/DTO contract; every returned status is enforced before bytes commit. */
export function ApiResponse(options: IApiResponseOptions): MethodDecorator {
  const status: number = options.status;
  if (
    !Number.isInteger(options.status) ||
    options.status < 200 ||
    options.status > 299 ||
    status === 205
  )
    throw new TypeError("Invalid response declaration");
  if (options.status !== 204 && typeof options.type !== "function")
    throw new TypeError("Response requires a DTO class");
  if (options.status === 204 && (options.type !== undefined || options.isArray !== undefined))
    throw new TypeError("Bodyless response declaration");
  if (options.isArray !== undefined && typeof options.isArray !== "boolean")
    throw new TypeError("Invalid array declaration");
  const value = RoutingMetadata.options(options);
  return (target, key, descriptor): void => {
    RoutingMetadata.methodTarget(target, key, descriptor);
    const current =
      RoutingMetadata.optional(
        RoutingMetadata.response.readDynamic(target.constructor, {
          kind: "member",
          member: key,
          inheritance: "own",
        }),
      ) ?? [];
    if (current.some((item) => item.status === options.status))
      throw new TypeError("Duplicate response declaration");
    RoutingMetadata.response.decorator(Object.freeze([...current, value]))(target, key, descriptor);
  };
}
