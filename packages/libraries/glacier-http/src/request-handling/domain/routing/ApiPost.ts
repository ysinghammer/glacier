import type { IApiRouteOptions } from "./IApiRouteOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Registers an explicit POST instance handler with optional documentation. */
export function ApiPost(path: string, options: IApiRouteOptions = {}): MethodDecorator {
  return RoutingMetadata.routeDecorator("POST", path, options);
}
