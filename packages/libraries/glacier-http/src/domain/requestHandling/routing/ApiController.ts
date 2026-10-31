import type { IApiControllerOptions } from "./types/IApiControllerOptions.js";
import { RoutingMetadata } from "./RoutingMetadata.js";

/** Legacy class decorator identifying an application-owned controller; starts no resources. */
export function ApiController(path: string, options: IApiControllerOptions = {}): ClassDecorator {
  RoutingMetadata.validatePath(path);
  const decorate = RoutingMetadata.controller.decorator(
    Object.freeze({ path, options: RoutingMetadata.options(options) }),
  );
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
