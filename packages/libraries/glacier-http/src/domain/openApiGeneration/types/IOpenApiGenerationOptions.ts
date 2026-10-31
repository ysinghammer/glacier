import type { IConstructableClass } from "@glacier/reflection";
import type { IHttpErrorMapping } from "../../requestHandling/responses/types/IHttpErrorMapping.js";
import type { IOpenApiInfo } from "./IOpenApiInfo.js";
import type { IOpenApiAuthenticationOptions } from "./IOpenApiAuthenticationOptions.js";

/** Prepared source data consumed by generation, independent of listeners, controller instances or transport implementations. */
export interface IOpenApiGenerationOptions {
  /** Registered controller class identities whose declarations are documented. */
  readonly controllers: readonly IConstructableClass<object>[];
  /** Static mappings that may contribute documented error responses. */
  readonly errorMappings: readonly IHttpErrorMapping[];
  /** Required API title, version, and optional description. */
  readonly info: IOpenApiInfo;
  /** Optional external authentication scheme; omission documents no security scheme. */
  readonly authentication?: IOpenApiAuthenticationOptions;
}
