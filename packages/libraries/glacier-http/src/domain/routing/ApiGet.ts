import type { IApiRouteOptions } from "./IApiRouteOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Minimal legacy GET registration prerequisite for real-socket primitive verification. */
export function ApiGet(path: string, options: IApiRouteOptions = {}): MethodDecorator {
  RoutingMetadata.validatePath(path);
  const decorate = RoutingMetadata.route.decorator(
    Object.freeze({ path, options: Object.freeze({ ...options }) }),
  );
  return (target, key, descriptor): void => {
    if (typeof target === "function" || typeof descriptor.value !== "function")
      throw new TypeError("GET requires an instance method");
    if (
      RoutingMetadata.optional(
        RoutingMetadata.route.readDynamic(target.constructor, {
          kind: "member",
          member: key,
          inheritance: "own",
        }),
      ) !== undefined
    )
      throw new TypeError("Duplicate GET declaration");
    decorate(target, key, descriptor);
  };
}
