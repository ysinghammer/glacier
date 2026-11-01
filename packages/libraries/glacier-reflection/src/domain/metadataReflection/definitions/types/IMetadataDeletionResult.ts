import type { IMetadataAddressRejection } from "../../addressing/types/IMetadataAddressRejection.js";
/** Result of deleting only a target class's direct declaration.
 * @property isValid Readonly discriminator; false is rejection, true is completed validation.
 * @property isDeleted Readonly true only when a direct declaration was removed.
 * @property code Readonly rejection category when isValid is false.
 */
export type IMetadataDeletionResult =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly isDeleted: boolean };
