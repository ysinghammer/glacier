import type { IMethodKey } from "./IMethodKey.js";
import type { IMethodParameters } from "./IMethodParameters.js";
import type { IParameterIndex } from "./IParameterIndex.js";
/** Checked instance method parameter address with a key and position inferred from the instance type.
 * @template T Instance surface whose callable keys and parameter tuples are inspected.
 * @property kind Readonly `method-parameter` discriminator for this address variant.
 * @property side Readonly optional instance side; omitted means `instance`.
 * @property member Readonly callable instance member key selected from T.
 * @property position Readonly zero-based finite index from the visible parameter tuple.
 * @default side=instance.
 */
export type IInstanceMethodParameterMetadataAddress<T extends object> = {
  [K in IMethodKey<T>]: {
    readonly kind: "method-parameter";
    readonly side?: "instance";
    readonly member: K;
    readonly position: IParameterIndex<IMethodParameters<NonNullable<T[K]>>>;
  };
}[IMethodKey<T>];
