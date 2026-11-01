import type { IApiControllerOptions } from "./types/IApiControllerOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/**
 * Declares the path prefix and documentation for an application-owned controller.
 * @param path Validated origin-form prefix shared by the controller's routes.
 * @param options Static controller documentation; defaults to an empty record.
 * @returns A class decorator that records controller metadata without creating resources.
 */
export function ApiController(path: string, options: IApiControllerOptions = {}): ClassDecorator {
  RoutingMetadata.validatePath(path);
  const decorate = RoutingMetadata.controller.decorator(
    Object.freeze({ path, options: RoutingMetadata.options(options) }),
  );
  /**
   * Attaches controller metadata to the class without constructing an instance.
   * @param target Controller class receiving this decorator.
   * @returns No value; records the validated prefix and options.
   * @throws {TypeError} When the class already has a controller declaration.
   */
  return (target): void => {
    if (
      RoutingMetadata.optional(
        RoutingMetadata.controller.readDynamic(target, { kind: "class", inheritance: "own" }),
      ) !== undefined
    )
      throw new TypeError("Duplicate controller declaration");
    decorate(target);
  };
}
