import type { IClass } from "../../targets/types/IClass.js";
import type { IConstructableClass } from "../../targets/types/IConstructableClass.js";
import type { IParameterIndex } from "./IParameterIndex.js";
/** Checked address for one constructor parameter on an accessible constructor.
 * Inaccessible constructor tuples require dynamic operations.
 * @template C Class whose constructor tuple supplies valid positions.
 * @property kind Always `constructor-parameter` for this address variant.
 * @property position Zero-based finite tuple index; dynamic addresses must use number.
 */
export type IConstructorParameterMetadataAddress<C extends IClass> = C extends IConstructableClass
  ? {
      readonly kind: "constructor-parameter";
      readonly position: IParameterIndex<ConstructorParameters<C>>;
    }
  : never;
