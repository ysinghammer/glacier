import type { IApiInputOptions } from "./IApiInputOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Binds a case-insensitive normalized header string, or undefined when absent. */
export function ApiHeader(name: string, options: IApiInputOptions = {}): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({
    location: "header",
    name: name.toLowerCase(),
    options: RoutingMetadata.options(options),
  });
}
