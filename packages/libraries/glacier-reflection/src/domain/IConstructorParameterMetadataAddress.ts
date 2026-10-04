import type { IClass } from "./IClass.js";
import type { IConstructableClass } from "./IConstructableClass.js";
import type { IParameterIndex } from "./IParameterIndex.js";
/** Inaccessible constructor tuples require explicitly dynamic operations. */
export type IConstructorParameterMetadataAddress<C extends IClass> = C extends IConstructableClass
  ? {
      readonly kind: "constructor-parameter";
      readonly position: IParameterIndex<ConstructorParameters<C>>;
    }
  : never;
