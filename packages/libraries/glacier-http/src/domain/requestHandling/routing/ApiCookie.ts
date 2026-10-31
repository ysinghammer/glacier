import type { IApiInputOptions } from "./IApiInputOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Binds one opaque cookie string, preserving empty values and absence. */
export function ApiCookie(name: string, options: IApiInputOptions = {}): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({
    location: "cookie",
    name,
    options: RoutingMetadata.options(options),
  });
}
