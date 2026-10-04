import type { IMetadataAddressRejection } from "./IMetadataAddressRejection.js";
import type { IMetadataDefinitionIdentity } from "./IMetadataDefinitionIdentity.js";
/** Valid address discovery returns distinct definition identities, not names. */
export type IMetadataDefinitionsResult =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly definitions: readonly IMetadataDefinitionIdentity[] };
