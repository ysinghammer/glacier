import type { IConstructableClass } from "@glacier/reflection";
import type { IApiInputOptions } from "./IApiInputOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Binds opaque cookie values through an explicit DTO with textual coercion. */
export function ApiCookies<T extends object>(
  dto: IConstructableClass<T>,
  options: IApiInputOptions = {},
): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({
    location: "cookies",
    dto,
    options: RoutingMetadata.options(options),
  });
}
