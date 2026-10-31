import type { IMetadataAddressRejection } from "../../addressing/types/IMetadataAddressRejection.js";
import type { IMetadataDefinitionIdentity } from "../../definitions/types/IMetadataDefinitionIdentity.js";
/** Result of discovering distinct definition identities at one address.
 * @property isValid Readonly discriminator; false is rejection, true is completed discovery.
 * @property definitions Readonly frozen identities in unspecified order when valid.
 * @property code Readonly rejection category when isValid is false.
 */
export type IMetadataDefinitionsResult =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly definitions: readonly IMetadataDefinitionIdentity[] };
