import { RoutingMetadata } from "./RoutingMetadata.js";

/** Binds the nonempty externally authenticated ID; requires a protected endpoint. */
export function ApiUserId(): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({ location: "userId" });
}
