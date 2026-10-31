import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpMethod } from "./IHttpMethod.js";
import type { IApiControllerOptions } from "./IApiControllerOptions.js";
import type { IApiRouteOptions } from "./IApiRouteOptions.js";
import type { IApiResponseOptions } from "./IApiResponseOptions.js";
import type { IHttpBindingMetadata } from "./IHttpBindingMetadata.js";
import type { IHttpErrorMapping } from "../responses/IHttpErrorMapping.js";

/** Immutable public endpoint contracts shared with future documentation consumers, not executable handlers. */
export interface IHttpEndpointMetadata {
  readonly controller: IConstructableClass<object>;
  readonly controllerName: string;
  readonly handlerName: string;
  readonly method: IHttpMethod;
  readonly template: string;
  readonly controllerOptions: IApiControllerOptions;
  readonly routeOptions: IApiRouteOptions;
  readonly isPublic: boolean;
  readonly isResponseLoggingSkipped: boolean;
  readonly bindings: readonly IHttpBindingMetadata[];
  readonly responses: readonly IApiResponseOptions[];
  readonly controllerErrorMappings: readonly IHttpErrorMapping[];
  readonly endpointErrorMappings: readonly IHttpErrorMapping[];
}
