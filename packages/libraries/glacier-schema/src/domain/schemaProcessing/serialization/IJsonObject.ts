import type { IJsonValue } from "./IJsonValue.js";

/** Readonly string-keyed JSON object, without undefined or executable values. */
export interface IJsonObject {
  readonly [key: string]: IJsonValue;
}
