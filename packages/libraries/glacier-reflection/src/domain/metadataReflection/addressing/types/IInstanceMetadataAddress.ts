import type { IMetadataClassAddress } from "./IMetadataClassAddress.js";
import type { IInstanceMemberMetadataAddress } from "./IInstanceMemberMetadataAddress.js";
import type { IInstanceMethodParameterMetadataAddress } from "./IInstanceMethodParameterMetadataAddress.js";
/** Union of class and instance-side addresses available through an instance alias.
 * @template T Instance surface whose member keys constrain the address.
 */
export type IInstanceMetadataAddress<T extends object> =
  | IMetadataClassAddress
  | IInstanceMemberMetadataAddress<T>
  | IInstanceMethodParameterMetadataAddress<T>;
