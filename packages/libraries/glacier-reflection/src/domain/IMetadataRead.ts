import type { IMetadataAddressRejection } from "./IMetadataAddressRejection.js";
/** Presence distinguishes absent declarations from present undefined values. */
export type IMetadataRead<T> =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly isPresent: false }
  | { readonly isValid: true; readonly isPresent: true; readonly value: T };
