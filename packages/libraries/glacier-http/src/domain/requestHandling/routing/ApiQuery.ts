import type { IConstructableClass } from "@glacier/reflection";
import type { IApiInputOptions } from "./IApiInputOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Binds nested textual query data with coercion and singleton scalar-array promotion. */
export function ApiQuery<T extends object>(
  dto: IConstructableClass<T>,
  options: IApiInputOptions = {},
): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({
    location: "query",
    dto,
    options: RoutingMetadata.options(options),
  });
}
