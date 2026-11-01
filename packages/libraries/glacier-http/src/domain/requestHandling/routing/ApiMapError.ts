import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpErrorMappingOptions } from "../responses/types/IHttpErrorMappingOptions.js";
import { ErrorMappings } from "../responses/ErrorMappings.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Declares a static error mapping on a controller or one of its instance endpoints.
 * @template E Error subtype selected by the class identity.
 * @param error Error constructor used as a matching identity, never instantiated here.
 * @param options Static public Problem Details fields for matching errors.
 * @returns A class or method decorator that records the mapping at its declaration scope.
 */
export function ApiMapError<E extends Error>(
  error: IConstructableClass<E>,
  options: IHttpErrorMappingOptions,
): ClassDecorator & MethodDecorator {
  const mapping = ErrorMappings.prepare([{ ...options, error }]);
  /**
   * Attaches the prepared mapping to its controller or instance endpoint scope.
   * @param target Class constructor or prototype receiving the decorator.
   * @param key Optional instance method name; absent for a class declaration.
   * @param descriptor Optional method descriptor required for endpoint declarations.
   * @returns No value; appends the mapping at the selected declaration scope.
   * @throws {TypeError} When the target is not a class or lacks an instance method descriptor.
   */
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
