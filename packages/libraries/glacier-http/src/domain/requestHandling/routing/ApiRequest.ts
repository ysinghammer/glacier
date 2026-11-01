import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Binds the detached readonly request without exposing a body stream or response socket.
 * @returns A parameter decorator that records the request binding.
 */
export function ApiRequest(): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({ location: "request" });
}
