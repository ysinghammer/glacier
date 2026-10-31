import type { IApiRouteOptions } from "./types/IApiRouteOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Registers an explicit PATCH instance handler with optional documentation. */
export function ApiPatch(path: string, options: IApiRouteOptions = {}): MethodDecorator {
  return RoutingMetadata.routeDecorator("PATCH", path, options);
}
