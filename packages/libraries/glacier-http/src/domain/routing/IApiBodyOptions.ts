import type { IJsonValue } from "@glacier/schema";
import type { IApiInputOptions } from "./IApiInputOptions.js";

/** Named raw JSON examples for the required object body. */
export interface IApiBodyOptions extends IApiInputOptions {
  readonly examples?: Readonly<Record<string, IJsonValue>>;
}
