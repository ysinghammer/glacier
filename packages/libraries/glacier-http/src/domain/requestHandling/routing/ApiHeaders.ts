import type { IConstructableClass } from "@glacier/reflection";
import type { IApiInputOptions } from "./types/IApiInputOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Binds normalized lower-case header names through an explicit DTO with textual coercion. */
export function ApiHeaders<T extends object>(
  dto: IConstructableClass<T>,
  options: IApiInputOptions = {},
): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({
    location: "headers",
    dto,
    options: RoutingMetadata.options(options),
  });
}
