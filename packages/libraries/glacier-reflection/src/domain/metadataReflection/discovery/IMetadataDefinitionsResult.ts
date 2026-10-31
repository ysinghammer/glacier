import type { IMetadataAddressRejection } from "../addressing/IMetadataAddressRejection.js";
import type { IMetadataDefinitionIdentity } from "../definitions/IMetadataDefinitionIdentity.js";
/** Valid address discovery returns distinct definition identities, not names. */
export type IMetadataDefinitionsResult =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly definitions: readonly IMetadataDefinitionIdentity[] };
