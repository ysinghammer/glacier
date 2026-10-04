import type { IMetadataAddressRejection } from "./IMetadataAddressRejection.js";
/** Successful writes replace one direct declaration; rejection is atomic. */
export type IMetadataWriteResult = IMetadataAddressRejection | { readonly isValid: true };
