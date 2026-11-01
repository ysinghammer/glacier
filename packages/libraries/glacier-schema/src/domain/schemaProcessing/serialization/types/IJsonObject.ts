import type { IJsonValue } from "./IJsonValue.js";

/** Readonly string-keyed JSON object, without undefined or executable values. */
export interface IJsonObject {
  /** Own JSON property mapped to its projected value. */
  readonly [key: string]: IJsonValue;
}
