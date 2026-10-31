import type { IMetadataAddressRejection } from "../../addressing/types/IMetadataAddressRejection.js";
/** Deletion affects only the target class's direct declaration. */
export type IMetadataDeletionResult =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly isDeleted: boolean };
