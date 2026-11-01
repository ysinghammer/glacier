import type { IApiRouteOptions } from "./types/IApiRouteOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Declares a GET instance route; HEAD requests use the same prepared pipeline.
 * @param path Origin-form route path, optionally containing named segments.
 * @param options Static route documentation options; defaults to an empty record.
 * @returns A method decorator that records the route metadata.
 */
export function ApiGet(path: string, options: IApiRouteOptions = {}): MethodDecorator {
  return RoutingMetadata.routeDecorator("GET", path, options);
}
