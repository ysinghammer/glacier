import { RoutingMetadata } from "./RoutingMetadata.js";

/** Binds the detached read-only request, never a body stream or response socket. */
export function ApiRequest(): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({ location: "request" });
}
