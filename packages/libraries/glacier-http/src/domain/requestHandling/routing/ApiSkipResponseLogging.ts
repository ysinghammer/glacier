import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Excludes response completion records for an endpoint while preserving diagnostics.
 * @returns A method decorator that records the response-logging opt-out.
 */
export function ApiSkipResponseLogging(): MethodDecorator {
  return RoutingMetadata.flagDecorator(RoutingMetadata.skipLogging);
}
