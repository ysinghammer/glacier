import type { IApiParamOptions } from "./types/IApiParamOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Binds one required nonempty path string without inferring a schema.
 * @param name Exact route parameter name without the colon prefix.
 * @param options Optional static input documentation and examples; defaults to empty.
 * @returns A parameter decorator that records the explicit binding.
 */
export function ApiParam(name: string, options: IApiParamOptions = {}): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({
    location: "param",
    name,
    options: RoutingMetadata.options(options),
  });
}
