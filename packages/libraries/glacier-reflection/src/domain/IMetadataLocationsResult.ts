import type { IMetadataAddressRejection } from "./IMetadataAddressRejection.js";
import type { IDiscoveredMetadataAddress } from "./IDiscoveredMetadataAddress.js";
/** Valid discovery returns readonly metadata-bearing addresses, not all members. */
export type IMetadataLocationsResult =
  | IMetadataAddressRejection
  | { readonly isValid: true; readonly addresses: readonly IDiscoveredMetadataAddress[] };
