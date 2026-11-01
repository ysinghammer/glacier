import type { IConstructableClass } from "@glacier/reflection";
import type { HttpServer } from "../../../requestHandling/adapters/inbound/HttpServer.adapter.js";
import type { IOpenApiInfo } from "../../../../domain/openApiGeneration/types/IOpenApiInfo.js";
import type { IOpenApiAuthenticationOptions } from "../../../../domain/openApiGeneration/types/IOpenApiAuthenticationOptions.js";

/** Supplies document metadata and exactly one source of controller registration information. */
export type IOpenApiOptions = {
  /** Document title, version, and other required OpenAPI information. */
  readonly info: IOpenApiInfo;
  /**
   * Authentication scheme to document; when absent, no scheme is generated.
   * @default absent
   */
  readonly authentication?: IOpenApiAuthenticationOptions;
} & (
  | {
      /** Controller classes whose contracts are reflected in the document. */
      readonly controllers: readonly IConstructableClass<object>[];
      /** Prohibited when controllers is the selected source. */
      readonly server?: never;
    }
  | {
      /** Created server whose curated registration snapshot supplies controller classes. */
      readonly server: HttpServer;
      /** Prohibited when server is the selected source. */
      readonly controllers?: never;
    }
);
