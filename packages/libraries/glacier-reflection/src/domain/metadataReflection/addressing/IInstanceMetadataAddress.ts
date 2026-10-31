import type { IMetadataClassAddress } from "./IMetadataClassAddress.js";
import type { IInstanceMemberMetadataAddress } from "./IInstanceMemberMetadataAddress.js";
import type { IInstanceMethodParameterMetadataAddress } from "./IInstanceMethodParameterMetadataAddress.js";
/** Only class and instance-side locations are available through instance aliases. */
export type IInstanceMetadataAddress<T extends object> =
  | IMetadataClassAddress
  | IInstanceMemberMetadataAddress<T>
  | IInstanceMethodParameterMetadataAddress<T>;
