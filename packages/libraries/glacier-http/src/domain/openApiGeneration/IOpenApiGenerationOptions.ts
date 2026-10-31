import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpErrorMapping } from "../requestHandling/responses/IHttpErrorMapping.js";
import type { IOpenApiInfo } from "./IOpenApiInfo.js";
import type { IOpenApiAuthenticationOptions } from "./IOpenApiAuthenticationOptions.js";

/** Prepared source data consumed by generation, independent of listeners, controller instances or transport implementations. */
export interface IOpenApiGenerationOptions {
  readonly controllers: readonly IConstructableClass<object>[];
  readonly errorMappings: readonly IHttpErrorMapping[];
  readonly info: IOpenApiInfo;
  readonly authentication?: IOpenApiAuthenticationOptions;
}
