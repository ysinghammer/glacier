import type { IClass } from "./IClass.js";
import type { IInstanceMetadataAddress } from "./IInstanceMetadataAddress.js";
import type { IStaticMemberMetadataAddress } from "./IStaticMemberMetadataAddress.js";
import type { IStaticMethodParameterMetadataAddress } from "./IStaticMethodParameterMetadataAddress.js";
import type { IConstructorParameterMetadataAddress } from "./IConstructorParameterMetadataAddress.js";
/** Complete checked constructor surface with separate sides and parameter kinds. */
export type IClassMetadataAddress<C extends IClass> =
  | IInstanceMetadataAddress<C["prototype"]>
  | IStaticMemberMetadataAddress<C>
  | IStaticMethodParameterMetadataAddress<C>
  | IConstructorParameterMetadataAddress<C>;
