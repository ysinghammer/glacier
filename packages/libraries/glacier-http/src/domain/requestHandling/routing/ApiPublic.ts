import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Marks an endpoint public so external authentication is not run for that route.
 * @returns A method decorator that records the public-route flag.
 */
export function ApiPublic(): MethodDecorator {
  return RoutingMetadata.flagDecorator(RoutingMetadata.publicRoute);
}
