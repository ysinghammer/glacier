import type { IApiRouteOptions } from "./types/IApiRouteOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Declares a PUT instance route with optional static documentation.
 * @param path Origin-form route path, optionally containing named segments.
 * @param options Static route documentation options; defaults to an empty record.
 * @returns A method decorator that records the route metadata.
 */
export function ApiPut(path: string, options: IApiRouteOptions = {}): MethodDecorator {
  return RoutingMetadata.routeDecorator("PUT", path, options);
}
