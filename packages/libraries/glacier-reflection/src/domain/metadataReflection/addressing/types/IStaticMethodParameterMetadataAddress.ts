import type { IClass } from "../../targets/types/IClass.js";
import type { IMethodKey } from "./IMethodKey.js";
import type { IMethodParameters } from "./IMethodParameters.js";
import type { IParameterIndex } from "./IParameterIndex.js";
import type { IStaticMemberKey } from "./IStaticMemberKey.js";
/** Checked static method parameter address with key and position inferred from a constructor type.
 * @template C Constructor whose static callable members and parameter tuples are checked.
 * @property kind Readonly `method-parameter` discriminator for this address variant.
 * @property side Readonly `static` side for this address variant.
 * @property member Readonly callable static key from C, excluding prototype.
 * @property position Readonly zero-based finite index from the visible parameter tuple.
 */
export type IStaticMethodParameterMetadataAddress<C extends IClass> = {
  [K in IMethodKey<C> & IStaticMemberKey<C>]: {
    readonly kind: "method-parameter";
    readonly side: "static";
    readonly member: K;
    readonly position: IParameterIndex<IMethodParameters<NonNullable<C[K]>>>;
  };
}[IMethodKey<C> & IStaticMemberKey<C>];
