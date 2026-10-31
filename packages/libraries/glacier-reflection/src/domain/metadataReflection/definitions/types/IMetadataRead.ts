import type { IMetadataAddressRejection } from "../../addressing/types/IMetadataAddressRejection.js";
/** Typed read result that separates invalid addresses, absence, and present values.
 * @template T Stored value type, including undefined when it is a valid present value.
 * @property isValid Readonly discriminator; false is rejection, true is completed lookup.
 * @property isPresent Readonly flag; true includes undefined, false has no value field.
 * @property value Readonly stored value when isPresent is true.
 */
export type IMetadataRead<T> =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly isPresent: false }
  | { readonly isValid: true; readonly isPresent: true; readonly value: T };
