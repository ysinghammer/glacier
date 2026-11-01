import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpMethod } from "./IHttpMethod.js";
import type { IApiControllerOptions } from "./IApiControllerOptions.js";
import type { IApiRouteOptions } from "./IApiRouteOptions.js";
import type { IApiResponseOptions } from "./IApiResponseOptions.js";
import type { IHttpBindingMetadata } from "./IHttpBindingMetadata.js";
import type { IHttpErrorMapping } from "../../responses/types/IHttpErrorMapping.js";

/** Detached endpoint contract for documentation consumers; it contains no executable handler. */
export interface IHttpEndpointMetadata {
  /** Controller class identity that owns the endpoint. */
  readonly controller: IConstructableClass<object>;
  /** Name used to identify the controller in diagnostic/documentation output. */
  readonly controllerName: string;
  /** Name of the declared instance handler. */
  readonly handlerName: string;
  /** Explicitly declared HTTP method. */
  readonly method: IHttpMethod;
  /** Origin-form route template after canonicalization. */
  readonly template: string;
  /** Static options declared on the owning controller. */
  readonly controllerOptions: IApiControllerOptions;
  /** Static options declared on this route. */
  readonly routeOptions: IApiRouteOptions;
  /** Whether authentication is skipped for this route. */
  readonly isPublic: boolean;
  /** Whether response completion records are suppressed for this route. */
  readonly isResponseLoggingSkipped: boolean;
  /** Ordered parameter binders, preserving handler parameter positions. */
  readonly bindings: readonly IHttpBindingMetadata[];
  /** Explicitly declared success response contracts. */
  readonly responses: readonly IApiResponseOptions[];
  /** Static error mappings declared at controller scope. */
  readonly controllerErrorMappings: readonly IHttpErrorMapping[];
  /** Static error mappings declared at endpoint scope. */
  readonly endpointErrorMappings: readonly IHttpErrorMapping[];
}
