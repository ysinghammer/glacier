import type { IConstructableClass } from "@glacier/reflection";
import type { IApiInputOptions } from "./types/IApiInputOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Binds normalized nested query data to an explicit DTO using textual coercion.
 * @template T Object DTO type identified by the supplied constructor.
 * @param dto DTO class identity used for input schema validation; never constructed.
 * @param options Optional static input documentation; defaults to an empty record.
 * @returns A parameter decorator that records the explicit binding.
 */
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
