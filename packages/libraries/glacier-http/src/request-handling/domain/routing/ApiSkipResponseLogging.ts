import { RoutingMetadata } from "./RoutingMetadata.js";

/** Records the route-level response-log exclusion; diagnostics remain enabled. */
export function ApiSkipResponseLogging(): MethodDecorator {
  return RoutingMetadata.flagDecorator(RoutingMetadata.skipLogging);
}
