import type { IApiResponseOptions } from "./IApiResponseOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Minimal explicit response contract; output validation precedes all response bytes. */
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
  const decorate = RoutingMetadata.response.decorator(Object.freeze({ ...options }));
  return (target, key, descriptor): void => {
    if (typeof target === "function" || typeof descriptor.value !== "function")
      throw new TypeError("Response requires an instance method");
    if (
      RoutingMetadata.optional(
        RoutingMetadata.response.readDynamic(target.constructor, {
          kind: "member",
          member: key,
          inheritance: "own",
        }),
      ) !== undefined
    )
      throw new TypeError("Duplicate response declaration");
    decorate(target, key, descriptor);
  };
}
