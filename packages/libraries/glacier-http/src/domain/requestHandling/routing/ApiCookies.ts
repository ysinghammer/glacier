import type { IConstructableClass } from "@glacier/reflection";
import type { IApiInputOptions } from "./types/IApiInputOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Binds opaque cookie values to an explicit DTO using textual coercion.
 * @template T Object DTO type identified by the supplied constructor.
 * @param dto DTO class identity used for input schema validation; never constructed.
 * @param options Optional static input documentation; defaults to an empty record.
 * @returns A parameter decorator that records the explicit binding.
 */
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
