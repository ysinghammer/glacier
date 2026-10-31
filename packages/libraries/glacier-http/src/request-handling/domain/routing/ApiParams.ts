import type { IConstructableClass } from "@glacier/reflection";
import type { IApiInputOptions } from "./IApiInputOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Binds path parameters through the explicit DTO with textual coercion. */
export function ApiParams<T extends object>(
  dto: IConstructableClass<T>,
  options: IApiInputOptions = {},
): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({
    location: "params",
    dto,
    options: RoutingMetadata.options(options),
  });
}
