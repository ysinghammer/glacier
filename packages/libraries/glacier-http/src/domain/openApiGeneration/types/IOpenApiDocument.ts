import type { IJsonObject } from "@glacier/schema";
import type { IOpenApiInfo } from "./IOpenApiInfo.js";

/** Detached readonly JSON-compatible OpenAPI 3.1 document, not a claim of complete external meta-schema validation. */
export interface IOpenApiDocument extends IJsonObject {
  /** Fixed OpenAPI document version emitted by this generator. */
  readonly openapi: "3.1.0";
  /** API identity metadata supplied during generation. */
  readonly info: IOpenApiInfo;
  /** Path-keyed operation objects in the generated document. */
  readonly paths: Readonly<Record<string, IJsonObject>>;
  /** Generated schemas, security schemes, and other OpenAPI components. */
  readonly components: IJsonObject;
}
