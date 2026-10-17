import type { IMethodKey } from "./IMethodKey.js";
import type { IMethodParameters } from "./IMethodParameters.js";
import type { IParameterIndex } from "./IParameterIndex.js";
/** Checked callable member and its exposed parameter positions. */
export type IInstanceMethodParameterMetadataAddress<T extends object> = {
  [K in IMethodKey<T>]: {
    readonly kind: "method-parameter";
    readonly side?: "instance";
    readonly member: K;
    readonly position: IParameterIndex<IMethodParameters<NonNullable<T[K]>>>;
  };
}[IMethodKey<T>];
