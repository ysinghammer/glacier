import type { IMetadataAddressRejection } from "../../addressing/types/IMetadataAddressRejection.js";
/** Result of checking declaration presence without returning the stored value.
 * @property isValid Readonly discriminator; false is rejection, true is completed lookup.
 * @property isPresent Readonly flag for a declaration, including present undefined values.
 */
export type IMetadataPresenceResult =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly isPresent: boolean };
