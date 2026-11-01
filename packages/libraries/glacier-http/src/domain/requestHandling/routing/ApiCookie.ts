import type { IApiInputOptions } from "./types/IApiInputOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Binds one opaque cookie value, preserving empty strings and absence.
 * @param name Exact case-sensitive cookie name.
 * @param options Optional static input documentation; defaults to an empty record.
 * @returns A parameter decorator that records the explicit binding.
 */
export function ApiCookie(name: string, options: IApiInputOptions = {}): ParameterDecorator {
  return RoutingMetadata.bindingDecorator({
    location: "cookie",
    name,
    options: RoutingMetadata.options(options),
  });
}
