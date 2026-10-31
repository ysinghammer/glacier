import type { IApiInputOptions } from "./types/IApiInputOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Binds one case-insensitive header value, or undefined when the field is absent.
 * @param name Header field name; it is normalized to lower case for metadata.
 * @param options Optional static input documentation; defaults to an empty record.
 * @returns A parameter decorator that records the explicit binding.
 */
export function ApiHeader(name: string, options: IApiInputOptions = {}): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({
    location: "header",
    name: name.toLowerCase(),
    options: RoutingMetadata.options(options),
  });
}
