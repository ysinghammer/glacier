import type { IJsonObject } from "@glacier/schema";

/** JSON-compatible descriptive API identity, supplied explicitly by application composition. */
export interface IOpenApiInfo extends IJsonObject {
  /** Human-readable API title. */
  readonly title: string;
  /** API version string supplied by the owning application. */
  readonly version: string;
  /** Optional human-readable API description. */
  readonly description?: string;
}
