import type { IJsonObject } from "@glacier/schema";
import type { IOpenApiInfo } from "./IOpenApiInfo.js";

/** Detached readonly JSON-compatible OpenAPI 3.1 document, not a claim of complete external meta-schema validation. */
export interface IOpenApiDocument extends IJsonObject {
  readonly openapi: "3.1.0";
  readonly info: IOpenApiInfo;
  readonly paths: Readonly<Record<string, IJsonObject>>;
  readonly components: IJsonObject;
}
