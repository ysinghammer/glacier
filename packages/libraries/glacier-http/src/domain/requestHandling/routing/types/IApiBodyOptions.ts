import type { IJsonValue } from "@glacier/schema";
import type { IApiInputOptions } from "./IApiInputOptions.js";

/** Named raw JSON examples for the required object body. */
export interface IApiBodyOptions extends IApiInputOptions {
  /** Optional named JSON examples copied into generated request-body documentation. */
  readonly examples?: Readonly<Record<string, IJsonValue>>;
}
