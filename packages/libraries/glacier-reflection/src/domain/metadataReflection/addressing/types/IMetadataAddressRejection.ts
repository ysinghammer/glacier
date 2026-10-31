import type { IMetadataAddressRejectionCode } from "./IMetadataAddressRejectionCode.js";
/** Discriminated validation result for an address operation rejected before mutation. */
export interface IMetadataAddressRejection {
  /** Readonly false discriminator separating rejection from valid absence or success. */
  readonly isValid: false;
  /** Readonly target, address, position, or instance restriction that failed validation. */
  readonly code: IMetadataAddressRejectionCode;
}
