import type { IApiRouteOptions } from "./types/IApiRouteOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Declares a POST instance route with optional static documentation.
 * @param path Origin-form route path, optionally containing named segments.
 * @param options Static route documentation options; defaults to an empty record.
 * @returns A method decorator that records the route metadata.
 */
export function ApiPost(path: string, options: IApiRouteOptions = {}): MethodDecorator {
  return RoutingMetadata.routeDecorator("POST", path, options);
}
