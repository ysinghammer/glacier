import type { IApiRouteOptions } from "./IApiRouteOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Registers an explicit DELETE instance handler with optional documentation. */
export function ApiDelete(path: string, options: IApiRouteOptions = {}): MethodDecorator {
  return RoutingMetadata.routeDecorator("DELETE", path, options);
}
