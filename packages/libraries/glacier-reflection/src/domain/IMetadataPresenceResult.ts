import type { IMetadataAddressRejection } from "./IMetadataAddressRejection.js";
/** Presence follows the requested lookup mode without returning a value. */
export type IMetadataPresenceResult =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly isPresent: boolean };
