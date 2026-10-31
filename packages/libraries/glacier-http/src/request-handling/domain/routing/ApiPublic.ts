import { RoutingMetadata } from "./RoutingMetadata.js";

/** Skips external authentication entirely for this endpoint. */
export function ApiPublic(): MethodDecorator {
  return RoutingMetadata.flagDecorator(RoutingMetadata.publicRoute);
}
