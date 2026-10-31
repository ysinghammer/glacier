import type { IMetadataAddressRejection } from "../../addressing/types/IMetadataAddressRejection.js";
import type { IMetadataDefinitionIdentity } from "../../definitions/types/IMetadataDefinitionIdentity.js";
/** Valid address discovery returns distinct definition identities, not names. */
export type IMetadataDefinitionsResult =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly definitions: readonly IMetadataDefinitionIdentity[] };
