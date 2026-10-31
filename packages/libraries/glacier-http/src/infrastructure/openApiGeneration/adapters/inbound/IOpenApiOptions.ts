import type { IConstructableClass } from "@glacier/reflection";
import type { HttpServer } from "../../../requestHandling/adapters/inbound/HttpServer.adapter.js";
import type { IOpenApiInfo } from "../../../../domain/openApiGeneration/types/IOpenApiInfo.js";
import type { IOpenApiAuthenticationOptions } from "../../../../domain/openApiGeneration/types/IOpenApiAuthenticationOptions.js";

/** Exactly one metadata source; controllers are class references and server exposes only its public registration snapshot. */
export type IOpenApiOptions = {
  readonly info: IOpenApiInfo;
  readonly authentication?: IOpenApiAuthenticationOptions;
} & (
  | { readonly controllers: readonly IConstructableClass<object>[]; readonly server?: never }
  | { readonly server: HttpServer; readonly controllers?: never }
);
