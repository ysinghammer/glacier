import type { IConstructableClass } from "@glacier/reflection";
import type { IApiBodyOptions } from "./types/IApiBodyOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Binds a required UTF-8 JSON object to an explicitly selected DTO without coercion.
 * @template T Object DTO type identified by the supplied constructor.
 * @param dto DTO class identity used for input schema validation; never constructed.
 * @param options Optional static body documentation and examples; defaults to empty.
 * @returns A parameter decorator that records the explicit body binding.
 */
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
