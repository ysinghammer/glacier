import type { IApiRouteOptions } from "./IApiRouteOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Registers an explicit PUT instance handler with optional documentation. */
export function ApiPut(path: string, options: IApiRouteOptions = {}): MethodDecorator {
  return RoutingMetadata.routeDecorator("PUT", path, options);
}
