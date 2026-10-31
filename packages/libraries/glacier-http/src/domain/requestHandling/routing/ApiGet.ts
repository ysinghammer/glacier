import type { IApiRouteOptions } from "./types/IApiRouteOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Registers an explicit GET endpoint; HEAD runs the same prepared pipeline. */
export function ApiGet(path: string, options: IApiRouteOptions = {}): MethodDecorator {
  return RoutingMetadata.routeDecorator("GET", path, options);
}
