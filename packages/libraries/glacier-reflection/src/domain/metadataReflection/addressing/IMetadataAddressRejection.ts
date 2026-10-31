import type { IMetadataAddressRejectionCode } from "./IMetadataAddressRejectionCode.js";
/** Invalid operations do not change any declaration. */
export interface IMetadataAddressRejection {
  readonly isValid: false;
  readonly code: IMetadataAddressRejectionCode;
}
