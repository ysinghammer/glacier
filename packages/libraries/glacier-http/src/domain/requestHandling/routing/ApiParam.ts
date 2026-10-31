import type { IApiParamOptions } from "./types/IApiParamOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Binds one required nonempty named path string, without schema inference. */
export function ApiParam(name: string, options: IApiParamOptions = {}): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({
    location: "param",
    name,
    options: RoutingMetadata.options(options),
  });
}
