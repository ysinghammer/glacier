import type { IJsonObject } from "@glacier/schema";

/** JSON-compatible descriptive API identity, supplied explicitly by application composition. */
export interface IOpenApiInfo extends IJsonObject {
  readonly title: string;
  readonly version: string;
  readonly description?: string;
}
