import type { IClass } from "./IClass.js";
import type { IMethodKey } from "./IMethodKey.js";
import type { IMethodParameters } from "./IMethodParameters.js";
import type { IParameterIndex } from "./IParameterIndex.js";
import type { IStaticMemberKey } from "./IStaticMemberKey.js";
/** Checked static callable member and its exposed parameter positions. */
export type IStaticMethodParameterMetadataAddress<C extends IClass> = {
  [K in IMethodKey<C> & IStaticMemberKey<C>]: {
    readonly kind: "method-parameter";
    readonly side: "static";
    readonly member: K;
    readonly position: IParameterIndex<IMethodParameters<NonNullable<C[K]>>>;
  };
}[IMethodKey<C> & IStaticMemberKey<C>];
