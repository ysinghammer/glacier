import type { IClass } from "../../targets/types/IClass.js";
import type { IClassMetadataAddress } from "./IClassMetadataAddress.js";
import type { IInstanceMetadataAddress } from "./IInstanceMetadataAddress.js";
/** Selects a checked address surface from the supplied constructor or instance type.
 * @template R Constructor or instance type whose location keys constrain reads.
 */
export type IMetadataReadAddress<R extends object> = R extends IClass
  ? IClassMetadataAddress<R>
  : IInstanceMetadataAddress<R>;
