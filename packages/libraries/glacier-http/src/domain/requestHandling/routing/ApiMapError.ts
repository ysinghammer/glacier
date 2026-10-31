import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpErrorMappingOptions } from "../responses/types/IHttpErrorMappingOptions.js";
import { ErrorMappings } from "../responses/ErrorMappings.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Declares repeatable static business mappings on a controller or instance endpoint only. */
export function ApiMapError<E extends Error>(
  error: IConstructableClass<E>,
  options: IHttpErrorMappingOptions,
): ClassDecorator & MethodDecorator {
  const mapping = ErrorMappings.prepare([{ ...options, error }]);
  return (target: object, key?: string | symbol, descriptor?: PropertyDescriptor): void => {
    if (key === undefined) {
      if (typeof target !== "function") throw new TypeError("Mapping requires a controller class");
    } else {
      if (descriptor === undefined) throw new TypeError("Mapping requires an instance method");
      RoutingMetadata.methodTarget(target, key, descriptor);
    }
    const controller = typeof target === "function" ? target : target.constructor;
    const address =
      key === undefined
        ? ({ kind: "class", inheritance: "own" } as const)
        : ({ kind: "member", member: key, inheritance: "own" } as const);
    const current =
      RoutingMetadata.optional(RoutingMetadata.errorMappings.readDynamic(controller, address)) ??
      [];
    const prepared = ErrorMappings.prepare([...current, ...mapping]);
    const decorate = RoutingMetadata.errorMappings.decorator(prepared);
    Reflect.apply(decorate, undefined, key === undefined ? [target] : [target, key, descriptor]);
  };
}
