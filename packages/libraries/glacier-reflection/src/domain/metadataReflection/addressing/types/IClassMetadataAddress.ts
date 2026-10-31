import type { IClass } from "../../targets/types/IClass.js";
import type { IInstanceMetadataAddress } from "./IInstanceMetadataAddress.js";
import type { IStaticMemberMetadataAddress } from "./IStaticMemberMetadataAddress.js";
import type { IStaticMethodParameterMetadataAddress } from "./IStaticMethodParameterMetadataAddress.js";
import type { IConstructorParameterMetadataAddress } from "./IConstructorParameterMetadataAddress.js";
/** Union of every statically checked location addressable through a constructor.
 * @template C Constructor whose static, instance, and parameter members are checked.
 */
export type IClassMetadataAddress<C extends IClass> =
  | IInstanceMetadataAddress<C["prototype"]>
  | IStaticMemberMetadataAddress<C>
  | IStaticMethodParameterMetadataAddress<C>
  | IConstructorParameterMetadataAddress<C>;
