import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Binds the nonempty external identity supplied by authentication on protected routes.
 * @returns A parameter decorator that records the authenticated-identity binding.
 */
export function ApiUserId(): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({ location: "userId" });
}
