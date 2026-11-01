import type { IMetadataAddressRejection } from "../../addressing/types/IMetadataAddressRejection.js";
/** Write result distinguishing atomic validation rejection from successful replacement.
 * @property isValid Readonly discriminator; true means replacement, false means rejection.
 * @property code Readonly rejection category when isValid is false.
 */
export type IMetadataWriteResult = IMetadataAddressRejection | { readonly isValid: true };
