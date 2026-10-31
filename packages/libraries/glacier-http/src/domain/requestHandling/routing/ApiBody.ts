import type { IConstructableClass } from "@glacier/reflection";
import type { IApiBodyOptions } from "./types/IApiBodyOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Binds a required UTF-8 JSON object through the explicit DTO without coercion. */
export function ApiBody<T extends object>(
  dto: IConstructableClass<T>,
  options: IApiBodyOptions = {},
): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({
    location: "body",
    dto,
    options: RoutingMetadata.options(options),
  });
}
